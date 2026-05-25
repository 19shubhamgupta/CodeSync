const express = require("express");
const {
  createFileNode,
  getFileNodes,
  updateFileNode,
} = require("../controllers/fileNodeController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/", verifyToken, createFileNode);
router.get("/workspace/:workspaceId", verifyToken, getFileNodes);
router.patch("/:id", verifyToken, updateFileNode);

module.exports = router;
