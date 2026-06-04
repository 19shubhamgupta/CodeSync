const express = require("express");
const {
  getWorkspaceByUserId,
  createWorkspace,
  getWorkspaceById,
  addMemberToWorkspace,
  getTemplates,
  importTemplateToWorkspace,
  runProject,
  stopProject,
  getRunStatus,
  getRunLogs,
} = require("../controllers/workSpaceController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/", verifyToken, getWorkspaceByUserId);
router.post("/", verifyToken, createWorkspace);
router.get("/templates", verifyToken, getTemplates);
router.post("/:id/import-template", verifyToken, importTemplateToWorkspace);
router.post("/:workspaceId/run/:fileId", verifyToken, runProject);
router.post("/:workspaceId/stop", verifyToken, stopProject);
router.get("/:workspaceId/run-status", verifyToken, getRunStatus);
router.get("/:workspaceId/logs", verifyToken, getRunLogs);
router.get("/:id", verifyToken, getWorkspaceById);
router.post("/:id/members", verifyToken, addMemberToWorkspace);

module.exports = router;
