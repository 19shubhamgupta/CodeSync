import express from "express";
import path from "path";
import dotenv from "dotenv";
import ConnectDB from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/authRouter.js";  
import fileNodeRouter from "./routes/fileNodeRouter.js";
import workspaceRouter from "./routes/workspaceRouter.js";
import githubRouter from "./routes/githubRouter.js"

import { app, server } from "./lib/socket.js";
import { setupProxyRoutes } from "./utils/code-execution/previewService.js";

dotenv.config();

setupProxyRoutes(app);

app.use(
  cors({
    origin: [
      "https://code-sync-lac-xi.vercel.app", // Your Vercel domain
      "http://localhost:5173", // Local testing
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/file", fileNodeRouter);
app.use("/api/github", githubRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/api/`);
  ConnectDB();
});

