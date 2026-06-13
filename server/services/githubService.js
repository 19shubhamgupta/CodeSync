import { Octokit } from "octokit";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { clerkClient } from "@clerk/clerk-sdk-node";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypt token for storage
 */
function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt token from storage
 */
function decryptToken(encryptedToken) {
  const parts = encryptedToken.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let decrypted = decipher.update(parts[1], "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

class GitHubService {
  /**
   * Exchange OAuth code for access token
   */
  async getAccessToken(userId) {
    console.log("🔐 getting access token...");

    try {
      const tokenResponse = await clerkClient.users.getUserOauthAccessToken(
        userId,
        "oauth_github"
      );

      // Clerk SDK may return an array directly or { data: [...] }
      const tokens = Array.isArray(tokenResponse)
        ? tokenResponse
        : tokenResponse?.data || [];

      if (!tokens.length || !tokens[0]?.token) {
        throw new Error(
          "GitHub account not connected. Please connect your GitHub account via your profile settings."
        );
      }

      const githubAccessToken = tokens[0].token;
      console.log("✅ OAuth token obtained");
      return githubAccessToken;
    } catch (error) {
      console.error("❌ OAuth error:", error.message);
      throw error;
    }
  }

  /**
   * Get GitHub user info
   */
  async getUserInfo(accessToken) {
    console.log("👤 Fetching GitHub user info...");
    
    try {
      const octokit = new Octokit({ auth: accessToken });
      const { data } = await octokit.rest.users.getAuthenticated();
      
      console.log(`✅ User info fetched: ${data.login}`);
      return data;
    } catch (error) {
      console.error("❌ Error fetching user info:", error.message);
      throw error;
    }
  }

  /**
   * Get user's repositories
   */
  async getUserRepos(accessToken) {
    console.log("📚 Fetching user repositories...");
    
    try {
      const octokit = new Octokit({ auth: accessToken });
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        direction: "desc",
        per_page: 20,
      });

      console.log(`✅ Found ${data.length} repositories`);
      return data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        owner: repo.owner.login,
        url: repo.html_url,
        description: repo.description,
      }));
    } catch (error) {
      console.error("❌ Error fetching repos:", error.message);
      throw error;
    }
  }

  /**
   * Create new repository
   */
  async createRepository(accessToken, repoName, description) {
    console.log(`🆕 Creating repository: ${repoName}...`);
    
    try {
      const octokit = new Octokit({ auth: accessToken });
      const { data } = await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: description,
        private: false,
        auto_init: true, // Initialize with README
      });

      console.log(`✅ Repository created: ${data.html_url}`);
      return {
        name: data.name,
        owner: data.owner.login,
        url: data.html_url,
      };
    } catch (error) {
      console.error("❌ Error creating repo:", error.message);
      throw error;
    }
  }

  /**
   * Push files to GitHub
   */
  async pushToGitHub(
    accessToken,
    owner,
    repo,
    fileMap,
    commitMessage,
    branch = "main"
  ) {
    console.log(`📤 Pushing to ${owner}/${repo}...`);
    
    try {
      const octokit = new Octokit({ auth: accessToken });

      // Get current tree SHA
      console.log("📍 Getting current branch...");
      const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const currentCommitSha = refData.object.sha;

      // Get current tree
      const { data: commitData } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: currentCommitSha,
      });

      // Create blob for each file
      console.log(`📝 Creating ${Object.keys(fileMap).length} blobs...`);
      const blobs = [];
      for (const [path, content] of Object.entries(fileMap)) {
        const { data: blobData } = await octokit.rest.git.createBlob({
          owner,
          repo,
          content: content,
          encoding: "utf-8",
        });
        blobs.push({
          path,
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        });
      }

      // Create tree
      console.log("🌳 Creating tree...");
      const { data: treeData } = await octokit.rest.git.createTree({
        owner,
        repo,
        tree: blobs,
        base_tree: commitData.tree.sha,
      });

      // Create commit
      console.log("💾 Creating commit...");
      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: commitMessage || "Updated from CodeSync",
        tree: treeData.sha,
        parents: [currentCommitSha],
      });

      // Update reference
      console.log("🔗 Updating reference...");
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      console.log(`✅ Pushed ${Object.keys(fileMap).length} files to GitHub`);
      return {
        success: true,
        commitSha: newCommit.sha,
        message: commitMessage,
      };
    } catch (error) {
      console.error("❌ Error pushing to GitHub:", error.message);
      throw error;
    }
  }

  /**
   * Pull files from GitHub
   */
  async pullFromGitHub(accessToken, owner, repo, branch = "main") {
    console.log(`📥 Pulling from ${owner}/${repo}:${branch}...`);
    
    try {
      const octokit = new Octokit({ auth: accessToken });

      // Get branch
      const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      // Get commit
      const { data: commitData } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: refData.object.sha,
      });

      // Get tree recursively
      console.log("🌳 Fetching tree...");
      const { data: treeData } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: commitData.tree.sha,
        recursive: 1,
      });

      // Get content of each file
      console.log(`📂 Fetching ${treeData.tree.length} files...`);
      const fileMap = {};
      for (const item of treeData.tree) {
        if (item.type === "blob") {
          const { data: blobData } = await octokit.rest.git.getBlob({
            owner,
            repo,
            file_sha: item.sha,
          });

          if (blobData.encoding === "base64") {
            fileMap[item.path] = Buffer.from(
              blobData.content,
              "base64"
            ).toString("utf-8");
          } else {
            fileMap[item.path] = blobData.content;
          }
        }
      }

      console.log(`✅ Pulled ${Object.keys(fileMap).length} files from GitHub`);
      return {
        success: true,
        files: fileMap,
        branch,
      };
    } catch (error) {
      console.error("❌ Error pulling from GitHub:", error.message);
      throw error;
    }
  }

  /**
   * Get branches
   */
  async getBranches(accessToken, owner, repo) {
    console.log(`🌿 Fetching branches from ${owner}/${repo}...`);
    
    try {
      const octokit = new Octokit({ auth: accessToken });
      const { data } = await octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 20,
      });

      console.log(`✅ Found ${data.length} branches`);
      return data.map((branch) => ({
        name: branch.name,
        isDefault: branch.protected,
        lastCommitSha: branch.commit.sha,
      }));
    } catch (error) {
      console.error("❌ Error fetching branches:", error.message);
      throw error;
    }
  }

  /**
   * Get commits
   */
  async getCommits(accessToken, owner, repo, branch = "main") {
    console.log(`📋 Fetching commits from ${owner}/${repo}:${branch}...`);
    
    try {
      const octokit = new Octokit({ auth: accessToken });
      const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page: 10,
      });

      console.log(`✅ Found ${data.length} commits`);
      return data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
      }));
    } catch (error) {
      console.error("❌ Error fetching commits:", error.message);
      throw error;
    }
  }

  /**
   * Encrypt token for storage
   */
  encryptToken(token) {
    return encryptToken(token);
  }

  /**
   * Decrypt token from storage
   */
  decryptToken(encryptedToken) {
    return decryptToken(encryptedToken);
  }
}

export default new GitHubService();