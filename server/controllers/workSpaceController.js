const Workspace = require("../models/workspace");
const User = require("../models/user");
const FileNode = require("../models/fileNode");
const templateService = require("../services/templateService");
const { buildSnapshot } = require("../utils/code-execution/snapShotService");
const { detectProject } = require("../utils/code-execution/detectionService");
const { writeTempDir } = require("../utils/code-execution/generateFileService");
const {
  runWorkspace,
  stopWorkspace,
  getRunInfo,
  getLogs,
} = require("../utils/code-execution/dockerRunService");

exports.getWorkspaceByUserId = async (req, res) => {
  try {
    const userId = req.user?.mongoId;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const workspaceIds = [
      ...user.ownedWorkspaceIds.map((id) => id.toString()),
      ...user.memberWorkspaceIds.map((id) => id.toString()),
    ];

    if (workspaceIds.length === 0) {
      return res.status(200).json({
        message: "Workspace fetched successfully",
        workspaces: [],
      });
    }

    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });
    const enriched = workspaces.map((workspace) => {
      const isOwner = workspace.ownerId?.toString() === userId.toString();
      const member = workspace.members.find(
        (m) => m.userId?.toString() === userId.toString(),
      );
      return {
        ...workspace.toObject(),
        role: isOwner ? "Owner" : member?.role || "Member",
      };
    });
    return res.status(200).json({
      message: "Workspace fetched successfully",
      workspaces: enriched,
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.createWorkspace = async (req, res) => {
  try {
    const userId = req.user?.mongoId;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    const { name, description, isPublic, members } = req.body;
    const shareLink = `${process.env.BASE_URL}/join/${name}/${userId}`;
    const newWorkspace = {
      name,
      ownerId: userId,
      description,
      isPublic: isPublic || true,
      members: members || [],
      shareLink,
    };
    const workspace = new Workspace(newWorkspace);
    await workspace.save();

    await User.updateOne(
      { _id: userId },
      { $addToSet: { ownedWorkspaceIds: workspace._id } },
    );
    return res.status(201).json({
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getWorkspaceById = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    return res.status(200).json({
      message: "Workspace fetched successfully",
      workspace: workspace,
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.addMemberToWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { userId, role } = req.body;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    const isMember = workspace.members.some(
      (member) => member.userId.toString() === userId,
    );
    if (isMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of the workspace" });
    }
    workspace.members.push({ userId, role });
    await workspace.save();

    await User.updateOne(
      { _id: userId },
      { $addToSet: { memberWorkspaceIds: workspace._id } },
    );
    return res.status(200).json({
      message: "Member added to workspace successfully",
      workspace: workspace,
    });
  } catch (error) {
    console.error("Error adding member to workspace:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = templateService.getAllTemplates();
    return res.status(200).json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.importTemplateToWorkspace = async (req, res) => {
  try {
    const userId = req.user?.mongoId;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    const workspaceId = req.params.id;
    const { templateId, rootName } = req.body;

    if (!templateId) {
      return res.status(400).json({ message: "templateId is required" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isOwner = workspace.ownerId?.toString() === userId.toString();
    const isMember = workspace.members.some(
      (member) => member.userId?.toString() === userId.toString(),
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await templateService.copyTemplateToWorkspace({
      templateId,
      workspaceId,
      rootName,
    });

    return res.status(201).json({
      message: "Template imported successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error importing template:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.runProject = async (req, res) => {
  try {
    const { fileId, workspaceId } = req.params;
    if (!fileId || !workspaceId) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const node = await FileNode.findById(fileId);
    if (!node || node.workspaceId?.toString() !== workspaceId) {
      return res.status(404).json({ message: "Node not found" });
    }

    if (!node.isRunnable) {
      return res.status(400).json({ message: "Node is not runnable" });
    }

    let rootNode = node.type === "folder" ? node : null;
    if (!rootNode && node.parentId) {
      rootNode = await FileNode.findById(node.parentId);
    }
    if (!rootNode) {
      return res
        .status(400)
        .json({ message: "Runnable node has no root folder" });
    }

    while (rootNode.parentId) {
      const parent = await FileNode.findById(rootNode.parentId);
      if (!parent) break;
      rootNode = parent;
    }

    const rootFolderId = rootNode._id.toString();

    console.log("Req came to exe : ", fileId);
    // 1. Snapshot
    const fileMap = await buildSnapshot(workspaceId, rootFolderId);
    console.log("FileMap generated is : ", fileMap);
    // 2. Detect
    const projectInfo = detectProject(fileMap);
    console.log("Project info is : ", projectInfo);
    // 3. Write temp files
    const tempDir = writeTempDir(workspaceId, fileMap);

    // 4. Build + run in Docker
    const { hostPort } = await runWorkspace(workspaceId, tempDir, projectInfo);
    console.log("Project running successfully  on port : ", hostPort);
    res.json({
      success: true,
      previewUrl: `/preview/${workspaceId}`,
      port: hostPort,
      projectType: projectInfo.type,
    });
  } catch (err) {
    console.log("Error in running the project", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.stopProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    await stopWorkspace(workspaceId);
    res.json({ success: true });
  } catch (err) {
    console.log("Error stopping project", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getRunStatus = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const info = getRunInfo(workspaceId);
    res.json({ running: !!info, info: info ? { port: info.port } : null });
  } catch (err) {
    console.log("Error fetching run status", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getRunLogs = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const since = Number(req.query.since || 0);
    if (!workspaceId) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const { lines, next } = getLogs(workspaceId, since);
    res.json({ lines, next });
  } catch (err) {
    console.log("Error fetching run logs", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
