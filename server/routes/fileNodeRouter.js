import express from "express";
import {
  createFileNode,
  getFileNodes,
  updateFileNode,
} from "../controllers/fileNodeController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, createFileNode);
router.get("/workspace/:workspaceId", verifyToken, getFileNodes);
router.patch("/:id", verifyToken, updateFileNode);

export default router;
