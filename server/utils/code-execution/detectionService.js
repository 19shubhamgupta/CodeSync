// services/detectionService.js

function parseRequirements(raw) {
  if (!raw) return new Set();
  const deps = new Set();
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .forEach((line) => {
      const name = line
        .split(/[=<>!~\[]/)[0]
        .trim()
        .toLowerCase();
      if (name) deps.add(name);
    });
  return deps;
}

function detectPythonProject(fileMap) {
  const requirementsRaw = fileMap["requirements.txt"] || "";
  const pyprojectRaw = (fileMap["pyproject.toml"] || "").toLowerCase();
  const requirements = parseRequirements(requirementsRaw);

  const hasManage = Boolean(fileMap["manage.py"]);
  const hasAppPy = Boolean(fileMap["app.py"]);
  const hasMainPy = Boolean(fileMap["main.py"]);

  const hasDjango =
    hasManage || requirements.has("django") || pyprojectRaw.includes("django");
  if (hasDjango) {
    return {
      type: "django",
      command: "python manage.py runserver 0.0.0.0:8000",
      port: 8000,
    };
  }

  const hasFastApi =
    requirements.has("fastapi") || pyprojectRaw.includes("fastapi");
  if (hasFastApi || hasMainPy) {
    return {
      type: "fastapi",
      command: "uvicorn main:app --host 0.0.0.0 --port 8000",
      port: 8000,
    };
  }

  const hasFlask = requirements.has("flask") || pyprojectRaw.includes("flask");
  if (hasFlask || hasAppPy) {
    return {
      type: "flask",
      command: "python -m flask --app app run --host 0.0.0.0 --port 8000",
      port: 8000,
    };
  }

  const hasPythonHint =
    requirements.size > 0 || pyprojectRaw || hasAppPy || hasMainPy || hasManage;
  if (hasPythonHint) {
    return { type: "python", command: "python main.py", port: 8000 };
  }

  return null;
}

function detectProject(fileMap) {
  const pkgRaw = fileMap["package.json"];
  if (pkgRaw) {
    const pkg = JSON.parse(pkgRaw);
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if (deps["next"]) {
      return { type: "nextjs", command: "npm run dev", port: 3000 };
    }

    if (deps["vite"] || deps["@vitejs/plugin-react"]) {
      return { type: "react-vite", command: "npm run dev", port: 5173 };
    }

    if (deps["react-scripts"]) {
      return { type: "cra", command: "npm start", port: 3000 };
    }

    if (deps["express"]) {
      return { type: "express", command: "node index.js", port: 3000 };
    }

    // fallback: use the start script if it exists
    const startScript = pkg.scripts?.start;
    if (startScript) {
      return { type: "node", command: "npm start", port: 3000 };
    }

    return { type: "node", command: "node index.js", port: 3000 };
  }

  const pythonProject = detectPythonProject(fileMap);
  if (pythonProject) {
    return pythonProject;
  }

  throw new Error("Undefined File Type");
}

module.exports = { detectProject };
