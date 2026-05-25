const express = require("express");
const {
  getWorkspaceByUserId,
  createWorkspace,
  getWorkspaceById,
  addMemberToWorkspace,
} = require("../controllers/workSpaceController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/", verifyToken, getWorkspaceByUserId);
router.post("/", verifyToken, createWorkspace);
router.get("/:id", verifyToken, getWorkspaceById);
router.post("/:id/members", verifyToken, addMemberToWorkspace);

module.exports = router;
