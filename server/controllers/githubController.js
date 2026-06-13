import githubService from "../services/githubService.js";
import Workspace from "../models/workspace.js";
import FileNode from "../models/fileNode.js";
import axios from "axios";


/**
 * GET /api/github/status
 * Check GitHub connection status for a workspace
 */
async function getGitHubStatus(req, res) {
  console.log("🔍 Checking GitHub status...");

  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: "Missing workspaceId" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Try to get GitHub token from Clerk
    let githubUser = null;
    let isGitHubAuthConnected = false;

    try {
      const accessToken = await githubService.getAccessToken(req.user.sub);
      if (accessToken) {
        isGitHubAuthConnected = true;
        const userInfo = await githubService.getUserInfo(accessToken);
        githubUser = {
          username: userInfo.login,
          name: userInfo.name,
          avatar: userInfo.avatar_url,
        };
      }
    } catch (err) {
      // GitHub not connected via Clerk — not a fatal error
      console.log("ℹ️ GitHub not connected via Clerk:", err.message);
    }

    const gi = workspace.githubIntegration || {};

    res.json({
      success: true,
      isGitHubAuthConnected,
      githubUser,
      isRepoLinked: gi.isConnected || false,
      repo: gi.isConnected
        ? {
            owner: gi.repoOwner,
            name: gi.repoName,
            url: gi.repoUrl,
            branch: gi.branch || "main",
            lastSyncedAt: gi.lastSyncedAt || null,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Status check error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/github/repos
 * Get user's GitHub repositories
 */
async function getUserRepos(req, res) {
  console.log("📚 Fetching user repositories...");

  try {
    const accessToken = await githubService.getAccessToken(req.user.sub);
    const repos = await githubService.getUserRepos(accessToken);

    res.json({
      success: true,
      repos,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/github/create-repo
 * Create new GitHub repository
 */
async function createRepository(req, res) {
  console.log("🆕 Creating GitHub repository...");

  try {
    const { repoName, description } = req.body;

    if (!repoName) {
      return res.status(400).json({ error: "Missing repoName" });
    }

    const accessToken = await githubService.getAccessToken(req.user.sub);

    const repo = await githubService.createRepository(
      accessToken,
      repoName,
      description
    );

    res.json({
      success: true,
      repo,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/github/link-repo
 * Link workspace to GitHub repository
 */
async function linkRepository(req, res) {
  console.log("🔗 Linking workspace to GitHub repository...");

  try {
    const { workspaceId, repoOwner, repoName, branch } = req.body;

    if (!workspaceId || !repoOwner || !repoName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const accessToken = await githubService.getAccessToken(req.user.sub);
    const encryptedToken = githubService.encryptToken(accessToken);

    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      {
        "githubIntegration.isConnected": true,
        "githubIntegration.repoOwner": repoOwner,
        "githubIntegration.repoName": repoName,
        "githubIntegration.repoUrl": `https://github.com/${repoOwner}/${repoName}`,
        "githubIntegration.accessToken": encryptedToken,
        "githubIntegration.branch": branch || "main",
        "githubIntegration.linkedAt": new Date(),
      },
      { new: true }
    );

    console.log(`✅ Workspace linked to ${repoOwner}/${repoName}`);

    res.json({
      success: true,
      message: "Repository linked successfully",
      workspace: {
        id: workspace._id,
        githubIntegration: {
          isConnected: workspace.githubIntegration.isConnected,
          repoOwner: workspace.githubIntegration.repoOwner,
          repoName: workspace.githubIntegration.repoName,
          repoUrl: workspace.githubIntegration.repoUrl,
          branch: workspace.githubIntegration.branch,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/github/push
 * Push workspace code to GitHub
 * rootFileNodeId is optional — omit to push ALL workspace files
 */
async function pushToGitHub(req, res) {
  console.log("📤 Pushing workspace to GitHub...");

  try {
    const { workspaceId, rootFileNodeId, commitMessage } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: "Missing workspaceId" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (!workspace.githubIntegration.isConnected) {
      return res.status(400).json({ error: "Repository not linked" });
    }

    // Collect all files (rootFileNodeId is optional; null = all workspace files)
    console.log("📁 Collecting files...");
    const fileMap = await collectAllFiles(workspaceId, rootFileNodeId || null);

    if (Object.keys(fileMap).length === 0) {
      return res.status(400).json({ error: "No files found to push" });
    }

    const accessToken = githubService.decryptToken(
      workspace.githubIntegration.accessToken
    );

    const result = await githubService.pushToGitHub(
      accessToken,
      workspace.githubIntegration.repoOwner,
      workspace.githubIntegration.repoName,
      fileMap,
      commitMessage || "Updated from CodeSync",
      workspace.githubIntegration.branch
    );

    await Workspace.findByIdAndUpdate(workspaceId, {
      "githubIntegration.lastSyncedAt": new Date(),
    });

    console.log("✅ Push successful");

    res.json({
      success: true,
      message: `Pushed ${Object.keys(fileMap).length} files to GitHub`,
      fileCount: Object.keys(fileMap).length,
      result,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/github/pull
 * Pull code from GitHub to workspace
 */
async function pullFromGitHub(req, res) {
  console.log("📥 Pulling from GitHub...");

  try {
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: "Missing workspaceId" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (!workspace.githubIntegration.isConnected) {
      return res.status(400).json({ error: "Repository not linked" });
    }

    const accessToken = githubService.decryptToken(
      workspace.githubIntegration.accessToken
    );

    const pullResult = await githubService.pullFromGitHub(
      accessToken,
      workspace.githubIntegration.repoOwner,
      workspace.githubIntegration.repoName,
      workspace.githubIntegration.branch
    );

    console.log("🔄 Updating workspace files...");
    await updateWorkspaceFilesFromGitHub(workspaceId, pullResult.files);

    await Workspace.findByIdAndUpdate(workspaceId, {
      "githubIntegration.lastSyncedAt": new Date(),
    });

    console.log("✅ Pull successful");

    res.json({
      success: true,
      message: `Pulled ${Object.keys(pullResult.files).length} files from GitHub`,
      fileCount: Object.keys(pullResult.files).length,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/github/branches
 * Get repository branches
 */
async function getBranches(req, res) {
  console.log("🌿 Getting branches...");

  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: "Missing workspaceId" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (!workspace.githubIntegration.isConnected) {
      return res.status(400).json({ error: "Repository not linked" });
    }

    const accessToken = githubService.decryptToken(
      workspace.githubIntegration.accessToken
    );

    const branches = await githubService.getBranches(
      accessToken,
      workspace.githubIntegration.repoOwner,
      workspace.githubIntegration.repoName
    );

    console.log(`✅ Retrieved ${branches.length} branches`);

    res.json({
      success: true,
      currentBranch: workspace.githubIntegration.branch,
      branches,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/github/switch-branch
 * Switch repository branch
 */
async function switchBranch(req, res) {
  console.log("🌿 Switching branch...");

  try {
    const { workspaceId, branchName } = req.body;

    if (!workspaceId || !branchName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (!workspace.githubIntegration.isConnected) {
      return res.status(400).json({ error: "Repository not linked" });
    }

    await Workspace.findByIdAndUpdate(
      workspaceId,
      { "githubIntegration.branch": branchName },
      { new: true }
    );

    console.log(`✅ Switched to branch: ${branchName}`);

    res.json({
      success: true,
      message: `Switched to branch: ${branchName}`,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/github/commits
 * Get repository commits
 */
async function getCommits(req, res) {
  console.log("📋 Getting commits...");

  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: "Missing workspaceId" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (!workspace.githubIntegration.isConnected) {
      return res.status(400).json({ error: "Repository not linked" });
    }

    const accessToken = githubService.decryptToken(
      workspace.githubIntegration.accessToken
    );

    const commits = await githubService.getCommits(
      accessToken,
      workspace.githubIntegration.repoOwner,
      workspace.githubIntegration.repoName,
      workspace.githubIntegration.branch
    );

    console.log(`✅ Retrieved ${commits.length} commits`);

    res.json({
      success: true,
      commits,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/github/disconnect
 * Disconnect/unlink a repository from a workspace
 */
async function disconnectRepository(req, res) {
  console.log("🔌 Disconnecting repository...");

  try {
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: "Missing workspaceId" });
    }

    await Workspace.findByIdAndUpdate(
      workspaceId,
      {
        "githubIntegration.isConnected": false,
        "githubIntegration.repoOwner": null,
        "githubIntegration.repoName": null,
        "githubIntegration.repoUrl": null,
        "githubIntegration.accessToken": null,
        "githubIntegration.branch": "main",
        "githubIntegration.linkedAt": null,
        "githubIntegration.lastSyncedAt": null,
      },
      { new: true }
    );

    console.log("✅ Repository disconnected");

    res.json({
      success: true,
      message: "Repository disconnected successfully",
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Helper: Collect all files from workspace
 * If rootFolderId is null — collects ALL files in the workspace
 * If rootFolderId is provided — collects files only in that subtree
 */
async function collectAllFiles(workspaceId, rootFolderId = null) {
  const allNodes = await FileNode.find({ workspaceId }).lean();
  if (allNodes.length === 0) return {};

  // Build a map for fast lookups
  const nodeMap = {};
  for (const node of allNodes) {
    nodeMap[node._id.toString()] = node;
  }

  // Helper to build relative path from a node
  function getFilePath(node, stopAtId = null) {
    const nodeId = node._id.toString();
    if (stopAtId && nodeId === stopAtId) return "";

    const parentId = node.parentId?.toString();
    if (!parentId) return node.name;

    // Stop recursion at the root folder boundary
    if (stopAtId && parentId === stopAtId) return node.name;

    const parent = nodeMap[parentId];
    if (!parent) return node.name;

    const parentPath = getFilePath(parent, stopAtId);
    return parentPath ? `${parentPath}/${node.name}` : node.name;
  }

  // --- Case 1: push ALL workspace files ---
  if (!rootFolderId) {
    const fileMap = {};
    for (const node of allNodes) {
      if (node.type !== "file") continue;
      fileMap[getFilePath(node, null)] = node.content || "";
    }
    return fileMap;
  }

  // --- Case 2: push subtree from rootFolderId ---
  const rootNode = nodeMap[rootFolderId.toString()];
  if (!rootNode) return {};

  // Collect all IDs in the subtree (BFS-style)
  const subtreeIds = new Set([rootFolderId.toString()]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of allNodes) {
      const nodeId = node._id.toString();
      const parentId = node.parentId?.toString();
      if (!subtreeIds.has(nodeId) && parentId && subtreeIds.has(parentId)) {
        subtreeIds.add(nodeId);
        changed = true;
      }
    }
  }

  const fileMap = {};
  for (const id of subtreeIds) {
    const node = nodeMap[id];
    if (!node || node.type !== "file") continue;
    const relativePath = getFilePath(node, rootFolderId.toString());
    fileMap[relativePath] = node.content || "";
  }

  return fileMap;
}

/**
 * Helper: Update workspace files from GitHub pull
 */
async function updateWorkspaceFilesFromGitHub(workspaceId, fileMap) {
  console.log("💾 Updating workspace files...");

  for (const [filePath, content] of Object.entries(fileMap)) {
    const parts = filePath.split("/");
    const fileName = parts.pop();

    let parentId = null;

    for (const folderName of parts) {
      let folderNode = await FileNode.findOne({
        workspaceId,
        name: folderName,
        parentId,
      });

      if (!folderNode) {
        folderNode = await FileNode.create({
          workspaceId,
          parentId,
          name: folderName,
          type: "folder",
          children: [],
        });

        if (parentId) {
          await FileNode.updateOne(
            { _id: parentId },
            { $push: { children: folderNode._id } }
          );
        }
      }

      parentId = folderNode._id;
    }

    let fileNode = await FileNode.findOne({
      workspaceId,
      name: fileName,
      parentId,
    });

    if (fileNode) {
      fileNode.content = content;
      fileNode.updatedAt = new Date();
      await fileNode.save();
    } else {
      await FileNode.create({
        workspaceId,
        parentId,
        name: fileName,
        type: "file",
        language: detectLanguage(fileName),
        content,
      });
    }
  }

  console.log(`✅ Updated workspace files`);
}

/**
 * Helper: Detect language from file extension
 */
function detectLanguage(fileName) {
  const ext = fileName.split(".").pop();
  const langMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    css: "css",
    html: "html",
    py: "python",
    java: "java",
    md: "markdown",
    go: "go",
    rs: "rust",
    cpp: "cpp",
    c: "c",
    rb: "ruby",
    php: "php",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    sql: "sql",
  };
  return langMap[ext] || "plaintext";
}

export {
  getGitHubStatus,
  getUserRepos,
  createRepository,
  linkRepository,
  pushToGitHub,
  pullFromGitHub,
  getBranches,
  switchBranch,
  getCommits,
  disconnectRepository,
};