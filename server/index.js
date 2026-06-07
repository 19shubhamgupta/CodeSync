const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const ConnectDB = require("./lib/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/authRouter");  
const fileNodeRouter = require("./routes/fileNodeRouter");
const workspaceRouter = require("./routes/workspaceRouter");
const githubRouter = require("./routes/githubRouter")

const { app, server } = require("./lib/socket");
const { setupProxyRoutes } = require("./utils/code-execution/previewService");

dotenv.config();

setupProxyRoutes(app);

app.use(
  cors({
    origin: "*",
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

