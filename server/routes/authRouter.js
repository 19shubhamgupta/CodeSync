import express from "express";
import { createUser } from "../controllers/authController.js";
import verifyClerkToken from "../middleware/verifyClerkToken.js";

const router = express.Router();

router.post("/users", verifyClerkToken, createUser);

export default router;
