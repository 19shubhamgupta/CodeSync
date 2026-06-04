// services/detectionService.js

function detectProject(fileMap) {
  const pkgRaw = fileMap["package.json"];
  if (!pkgRaw){
    throw new Error("Undefined File Type")
    //return { type: "node", command: "node index.js", port: 3000 };
  }

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

module.exports = { detectProject };