// utils/code-execution/dockerRunService.js
const { spawnSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { generateDockerfile } = require("./dockerFileGenerator");

const runningContainers = {}; // workspaceId -> { containerId, port, proc, logs }
const MAX_LOG_LINES = 1000;

// ─── Logging ────────────────────────────────────────────────────────────────

function appendLog(workspaceId, line) {
  const info = runningContainers[workspaceId];
  if (!info) return;
  info.logs.push(line);
  if (info.logs.length > MAX_LOG_LINES) {
    info.logs.splice(0, info.logs.length - MAX_LOG_LINES);
  }
}

function attachProcessLogs(workspaceId, proc) {
  let stdoutBuffer = "";
  let stderrBuffer = "";

  if (proc.stdout) {
    proc.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const parts = stdoutBuffer.split("\n");
      stdoutBuffer = parts.pop() || "";
      parts.forEach((line) => appendLog(workspaceId, line));
    });
  }

  if (proc.stderr) {
    proc.stderr.on("data", (chunk) => {
      stderrBuffer += chunk.toString();
      const parts = stderrBuffer.split("\n");
      stderrBuffer = parts.pop() || "";
      parts.forEach((line) => appendLog(workspaceId, line));
    });
  }

  proc.on("close", (code) => {
    if (stdoutBuffer) appendLog(workspaceId, stdoutBuffer);
    if (stderrBuffer) appendLog(workspaceId, stderrBuffer);
    appendLog(workspaceId, `Process exited with code ${code}`);
  });
}

// ─── Port Manager ───────────────────────────────────────────────────────────

function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port);
  });
}

async function allocateFreePort(start = 4000, end = 5000) {
  for (let p = start; p <= end; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error("No free ports available in range 4000-5000");
}

// ─── Core ────────────────────────────────────────────────────────────────────

async function runWorkspace(workspaceId, tempDir, projectInfo) {
  const { type, port: containerPort } = projectInfo;

  console.log("tempDir:", tempDir);
  console.log("projectInfo:", projectInfo);

  // stop any existing container for this workspace first
  await stopWorkspace(workspaceId);

  // write Dockerfile into tempDir
  const dockerfile = generateDockerfile(type);
  fs.writeFileSync(path.join(tempDir, "Dockerfile"), dockerfile, "utf8");
  console.log("Dockerfile written for project type:", type);

  // image name must be lowercase, no special chars
  const imageName = `codesync-${workspaceId.toString().toLowerCase()}`;

  // ── Build image ──
  // use spawnSync with array args so spaces in tempDir path don't break anything
  console.log("Building docker image:", imageName);
  const buildResult = spawnSync(
    "docker",
    ["build", "-t", imageName, tempDir],
    {
      stdio: "inherit",
      timeout: 120000, // 2 min timeout for npm install inside build
    }
  );

  if (buildResult.error) {
    throw new Error(`Docker build process error: ${buildResult.error.message}`);
  }
  if (buildResult.status !== 0) {
    throw new Error(`Docker build failed with exit code ${buildResult.status}`);
  }

  console.log("Docker image built successfully:", imageName);

  // ── Allocate port ──
  const hostPort = await allocateFreePort();
  console.log("Allocated host port:", hostPort);

  // ── Run container ──
  const proc = spawn("docker", [
    "run", "--rm",
    "--name", imageName,
    "-p", `${hostPort}:${containerPort}`,
    "--memory", "256m",
    "--cpus", "0.5",
    imageName,
  ]);

  runningContainers[workspaceId.toString()] = {
    containerId: imageName,
    port: hostPort,
    proc,
    logs: [],
  };

  appendLog(workspaceId, `Starting container ${imageName} on port ${hostPort}`);
  attachProcessLogs(workspaceId, proc);

  proc.on("error", (err) => {
    console.error(`Container process error for ${imageName}:`, err);
    appendLog(workspaceId, `Container error: ${err.message}`);
  });

  proc.on("exit", (code) => {
    console.log(`Container ${imageName} exited with code ${code}`);
    appendLog(workspaceId, `Container exited with code ${code}`);
    delete runningContainers[workspaceId.toString()];
  });

  return { hostPort };
}

async function stopWorkspace(workspaceId) {
  const info = runningContainers[workspaceId.toString()];
  if (!info) return;

  console.log("Stopping container:", info.containerId);

  try {
    // array args — safe for all platforms
    spawnSync("docker", ["rm", "-f", info.containerId], { stdio: "ignore" });
  } catch (_) {}

  try {
    info.proc?.kill();
  } catch (_) {}

  delete runningContainers[workspaceId.toString()];
  console.log("Container stopped:", info.containerId);
}

function getRunInfo(workspaceId) {
  return runningContainers[workspaceId.toString()] || null;
}

function getLogs(workspaceId, since = 0) {
  const info = runningContainers[workspaceId.toString()];
  if (!info) {
    return { lines: [], next: since };
  }
  const safeSince = Number.isFinite(since) && since >= 0 ? since : 0;
  const lines = info.logs.slice(safeSince);
  return { lines, next: safeSince + lines.length };
}

module.exports = { runWorkspace, stopWorkspace, getRunInfo, getLogs };