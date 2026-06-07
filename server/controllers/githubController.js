const githubService = require("../services/githubService");
const Workspace = require("../models/workspace");
const FileNode = require("../models/fileNode");
const axios = require("axios");

/**
 * GET /api/github/callback
 * GitHub OAuth callback (exchanges code for token)
 */
async function handleOAuthCallback(req, res) {
  console.log("🔄 GitHub OAuth callback received...");
  
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = response.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ error: "Failed to exchange authorization code" });
    }

    const userInfo = await githubService.getUserInfo(accessToken);

    console.log(`✅ OAuth successful for user: ${userInfo.login}`);

    res.json({
      success: true,
      accessToken,
      user: {
        username: userInfo.login,
        name: userInfo.name,
        avatar: userInfo.avatar_url,
      },
    });
  } catch (error) {
    console.error("❌ OAuth error:", error.message);
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
      return res
        .status(400)
        .json({ error: "Missing repoName" });
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
    const { workspaceId, repoOwner, repoName, branch } =
      req.body;

    if (!workspaceId || !repoOwner || !repoName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const accessToken = await githubService.getAccessToken(req.user.sub);

    // Update workspace
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
 */
async function pushToGitHub(req, res) {
  console.log("📤 Pushing workspace to GitHub...");
  
  try {
    const { workspaceId, rootFileNodeId, commitMessage } = req.body;

    if (!workspaceId || !rootFileNodeId) {
      return res
        .status(400)
        .json({ error: "Missing workspaceId or rootFileNodeId" });
    }

    // Get workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace.githubIntegration.isConnected) {
      return res.status(400).json({ error: "Repository not linked" });
    }

    // Collect all files
    console.log("📁 Collecting files...");
    const fileMap = await collectAllFiles(workspaceId, rootFileNodeId);

    // Decrypt token
    const accessToken = githubService.decryptToken(
      workspace.githubIntegration.accessToken
    );

    // Push to GitHub
    const result = await githubService.pushToGitHub(
      accessToken,
      workspace.githubIntegration.repoOwner,
      workspace.githubIntegration.repoName,
      fileMap,
      commitMessage,
      workspace.githubIntegration.branch
    );

    // Update last synced time
    await Workspace.findByIdAndUpdate(workspaceId, {
      "githubIntegration.lastSyncedAt": new Date(),
    });

    console.log("✅ Push successful");

    res.json({
      success: true,
      message: `Pushed ${Object.keys(fileMap).length} files to GitHub`,
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

    // Get workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace.githubIntegration.isConnected) {
      return res.status(400).json({ error: "Repository not linked" });
    }

    // Decrypt token
    const accessToken = githubService.decryptToken(
      workspace.githubIntegration.accessToken
    );

    // Pull from GitHub
    const pullResult = await githubService.pullFromGitHub(
      accessToken,
      workspace.githubIntegration.repoOwner,
      workspace.githubIntegration.repoName,
      workspace.githubIntegration.branch
    );

    // Update workspace files
    console.log("🔄 Updating workspace files...");
    await updateWorkspaceFilesFromGitHub(workspaceId, pullResult.files);

    // Update last synced time
    await Workspace.findByIdAndUpdate(workspaceId, {
      "githubIntegration.lastSyncedAt": new Date(),
    });

    console.log("✅ Pull successful");

    res.json({
      success: true,
      message: `Pulled ${Object.keys(pullResult.files).length} files from GitHub`,
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

    if (!workspace.githubIntegration.isConnected) {
      return res.status(400).json({ error: "Repository not linked" });
    }

    // Update workspace
    await Workspace.findByIdAndUpdate(
      workspaceId,
      {
        "githubIntegration.branch": branchName,
      },
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
 * Helper: Collect all files from workspace (single query, parentId-based)
 */
async function collectAllFiles(workspaceId, rootFolderId) {
  const allNodes = await FileNode.find({ workspaceId }).lean();

  if (allNodes.length === 0) return {};

  const nodeMap = {};
  for (const node of allNodes) {
    nodeMap[node._id.toString()] = node;
  }

  const rootNode = nodeMap[rootFolderId.toString()];
  if (!rootNode) return {};

  const subtreeIds = new Set();
  subtreeIds.add(rootFolderId.toString());

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

  function getRelativePath(node) {
    const nodeId = node._id.toString();
    if (nodeId === rootFolderId.toString()) return "";

    const parentId = node.parentId?.toString();
    const parent = nodeMap[parentId];

    if (parentId === rootFolderId.toString()) return node.name;

    const parentPath = getRelativePath(parent);
    return parentPath ? `${parentPath}/${node.name}` : node.name;
  }

  const fileMap = {};
  for (const id of subtreeIds) {
    const node = nodeMap[id];
    if (!node || node.type !== "file") continue;

    const relativePath = getRelativePath(node);
    fileMap[relativePath] = node.content || "";
  }

  return fileMap;
}

/**
 * Helper: Update workspace files from GitHub
 */
async function updateWorkspaceFilesFromGitHub(workspaceId, fileMap) {
  console.log("💾 Updating workspace files...");

  for (const [filePath, content] of Object.entries(fileMap)) {
    const parts = filePath.split("/");
    const fileName = parts.pop();

    // Get or create folder nodes
    let parentId = null;
    let currentPath = "";

    for (const folderName of parts) {
      currentPath += folderName + "/";

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

    // Create or update file
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
  };
  return langMap[ext] || "plaintext";
}

module.exports = {
  handleOAuthCallback,
  getUserRepos,
  createRepository,
  linkRepository,
  pushToGitHub,
  pullFromGitHub,
  getBranches,
  switchBranch,
  getCommits,
};