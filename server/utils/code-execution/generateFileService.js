const fs = require("fs");
const path = require("path");
const crypto = require("crypto")

function writeTempDir(workspaceId, fileId, fileMap) {
  const dir = path.join(__dirname, "../../temp",`${workspaceId}-${fileId}-${crypto.randomUUID()}` );

  // clean up previous run
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  for (const [filePath, content] of Object.entries(fileMap)) {
    const fullPath = path.join(dir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf8");
  }

  return dir;
}

module.exports = {writeTempDir}