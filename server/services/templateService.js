const fs = require("fs");
const path = require("path");
const FileNode = require("../models/fileNode");

const TEMPLATE_ROOT = path.join(__dirname, "..", "templates");

const TEMPLATE_CATALOG = [
  {
    id: "react-vite",
    name: "React + Vite",
    description: "React app with Vite and minimal styling.",
    icon: "react",
  },
  {
    id: "express-api",
    name: "Express API",
    description: "Minimal Express REST API server.",
    icon: "express",
  },
  {
    id: "next-js",
    name: "Next.js",
    description: "Next.js starter with pages directory.",
    icon: "next",
  },
];

const languageForFile = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".js":
      return "javascript";
    case ".jsx":
      return "javascript";
    case ".ts":
      return "typescript";
    case ".tsx":
      return "typescript";
    case ".json":
      return "json";
    case ".html":
      return "html";
    case ".css":
      return "css";
    case ".md":
      return "markdown";
    default:
      return "plaintext";
  }
};

const getAllTemplates = () => TEMPLATE_CATALOG;

const getTemplateById = (templateId) =>
  TEMPLATE_CATALOG.find((template) => template.id === templateId);

const copyTemplateToWorkspace = async ({
  templateId,
  workspaceId,
  rootName,
}) => {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error("Invalid templateId");
  }

  const templatePath = path.join(TEMPLATE_ROOT, templateId);
  if (!fs.existsSync(templatePath)) {
    throw new Error("Template files not found");
  }

  const templateRootName = rootName || template.name;
  const rootNode = await FileNode.create({
    name: templateRootName,
    type: "folder",
    isRunnable : true,
    runType : template.id,
    workspaceId,
    parentId: null,
  });

  const createdNodes = [];

  const copyDirectory = async (currentPath, parentId) => {
    const entries = await fs.promises.readdir(currentPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        const folderNode = await FileNode.create({
          name: entry.name,
          type: "folder",
          workspaceId,
          parentId,
        });
        createdNodes.push(folderNode._id.toString());
        await copyDirectory(entryPath, folderNode._id);
      } else {
        const content = await fs.promises.readFile(entryPath, "utf8");
        const fileNode = await FileNode.create({
          name: entry.name,
          type: "file",
          language : languageForFile(entry.name),
          content,
          workspaceId,
          parentId,
        });
        createdNodes.push(fileNode._id.toString());
      }
    }
  };

  await copyDirectory(templatePath, rootNode._id);

  return {
    workspaceId,
    rootFolderId: rootNode._id.toString(),
    createdCount: createdNodes.length + 1,
  };
};

module.exports = {
  getAllTemplates,
  copyTemplateToWorkspace,
};
