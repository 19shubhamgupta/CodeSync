import express from "express";
import * as githubController from "../controllers/githubController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();



/**
 * GET /api/github/status
 * Check GitHub auth connection + workspace repo link status
 */
router.get("/status", verifyToken, githubController.getGitHubStatus);

/**
 * POST /api/github/repos
 * Get user's GitHub repositories (fetches token from Clerk)
 */
router.post("/repos", verifyToken, githubController.getUserRepos);

/**
 * POST /api/github/create-repo
 * Create a new GitHub repository
 */
router.post("/create-repo", verifyToken, githubController.createRepository);

/**
 * POST /api/github/link-repo
 * Link a workspace to a GitHub repository
 */
router.post("/link-repo", verifyToken, githubController.linkRepository);

/**
 * POST /api/github/push
 * Push workspace files to GitHub (rootFileNodeId optional — omit to push all)
 */
router.post("/push", verifyToken, githubController.pushToGitHub);

/**
 * POST /api/github/pull
 * Pull latest files from GitHub into workspace
 */
router.post("/pull", verifyToken, githubController.pullFromGitHub);

/**
 * GET /api/github/branches
 * Get repository branches
 */
router.get("/branches", verifyToken, githubController.getBranches);

/**
 * POST /api/github/switch-branch
 * Switch the active branch for a workspace
 */
router.post("/switch-branch", verifyToken, githubController.switchBranch);

/**
 * GET /api/github/commits
 * Get recent commits for the linked repository
 */
router.get("/commits", verifyToken, githubController.getCommits);

/**
 * POST /api/github/disconnect
 * Unlink the GitHub repository from a workspace
 */
router.post("/disconnect", verifyToken, githubController.disconnectRepository);

export default router;