// helpers/dockerfileGenerator.js

function generateDockerfile(projectType) {
  const base = `FROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\n`;

  const commands = {
    "react-vite": `EXPOSE 5173\nCMD ["npm", "run", "dev", "--", "--host"]`,
    "nextjs":     `EXPOSE 3000\nCMD ["npm", "run", "dev"]`,
    "express":    `EXPOSE 3000\nCMD ["node", "index.js"]`,
    "node":       `EXPOSE 3000\nCMD ["node", "index.js"]`,
    "cra":        `EXPOSE 3000\nCMD ["npm", "start"]`,
  };

  return base + (commands[projectType] || commands["node"]);
}

module.exports = { generateDockerfile };