const express = require("express");
const router = express.Router();
const githubController = require("../controllers/githubController");
const verifyToken = require("../middleware/verifyToken");

/**
 * Get user's repositories
 */
router.post("/repos", verifyToken, githubController.getUserRepos);

/**
 * Create new repository
 */
router.post("/create-repo", verifyToken, githubController.createRepository);

/**
 * Link workspace to repository
 */
router.post("/link-repo", verifyToken, githubController.linkRepository);

/**
 * Push to GitHub
 */
router.post("/push", verifyToken, githubController.pushToGitHub);

/**
 * Pull from GitHub
 */
router.post("/pull", verifyToken, githubController.pullFromGitHub);

/**
 * Get branches
 */
router.get("/branches", verifyToken, githubController.getBranches);

/**
 * Switch branch
 */
router.post("/switch-branch", verifyToken, githubController.switchBranch);

/**
 * Get commits
 */
router.get("/commits", verifyToken, githubController.getCommits);

module.exports = router;