const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

const userSocketMap = {}; // {userId: socketId}

const getWorkspaceRoom = (workspaceId) => `workspace:${workspaceId}`;

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  socket.on("joinWorkspace", ({ workspaceId }) => {
    if (!workspaceId) {
      return;
    }
    socket.join(getWorkspaceRoom(workspaceId));
    console.log("User joined workspace", socket.id, workspaceId);
  });

  socket.on("leaveWorkspace", ({ workspaceId }) => {
    if (!workspaceId) {
      return;
    }
    socket.leave(getWorkspaceRoom(workspaceId));
    console.log("User left workspace", socket.id, workspaceId);
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }
    console.log("A user disconnected", socket.id);
  });
});

const getSocketIdFromUserId = (receiverId) => {
  return userSocketMap[receiverId];
};

module.exports = { io, app, server, getSocketIdFromUserId };
