const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const ConnectDB = require("./lib/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/authRouter");  
const fileNodeRouter = require("./routes/fileNodeRouter");
const workspaceRouter = require("./routes/workspaceRouter");

// const { app, server } = require("./lib/socket");
const app = express();
dotenv.config();

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/api/`);
  ConnectDB();
});

