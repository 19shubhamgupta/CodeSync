// helpers/dockerfileGenerator.js

function generateDockerfile(projectType) {
  const nodeBase = `FROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\n`;
  const pythonBase = `FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install --no-cache-dir -r requirements.txt\n`;

  const nodeCommands = {
    "react-vite": `EXPOSE 5173\nCMD ["npm", "run", "dev", "--", "--host"]`,
    nextjs: `EXPOSE 3000\nCMD ["npm", "run", "dev"]`,
    express: `EXPOSE 3000\nCMD ["node", "index.js"]`,
    node: `EXPOSE 3000\nCMD ["node", "index.js"]`,
    cra: `EXPOSE 3000\nCMD ["npm", "start"]`,
  };

  const pythonCommands = {
    fastapi: `EXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`,
    flask: `EXPOSE 8000\nCMD ["python", "-m", "flask", "--app", "app", "run", "--host", "0.0.0.0", "--port", "8000"]`,
    django:
      `RUN python manage.py migrate --run-syncdb\n` +
      `RUN python manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); U.objects.filter(username='admin').exists() or U.objects.create_superuser('admin','admin@example.com','admin')"\n` +
      `EXPOSE 8000\nCMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]`,
    python: `EXPOSE 8000\nCMD ["python", "main.py"]`,
  };

  if (pythonCommands[projectType]) {
    return pythonBase + pythonCommands[projectType];
  }

  return nodeBase + (nodeCommands[projectType] || nodeCommands["node"]);
}

export { generateDockerfile };
