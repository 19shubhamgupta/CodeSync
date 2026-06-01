const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const { applyOperation, transform } = require("../utils/ot");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173" ],
  },
});

const userSocketMap = {}; // {userId: socketId}
const fileStates = {}; // { fileId: { content: string, pendingOps: [], revision: number } }

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

  socket.on(
    "file:edit",
    ({ workspaceId, fileId, operation, userId, timestamp, baseRevision }) => {
      if (!workspaceId || !fileId) {
        return;
      }

      if (!operation) {
        return;
      }

      // Initialize file state if doesn't exist
      if (!fileStates[fileId]) {
        fileStates[fileId] = {
          content: "",
          pendingOps: [],
          revision: 0,
        };
      }

      const fileState = fileStates[fileId];
      const clientRevision =
        typeof baseRevision === "number" ? baseRevision : fileState.revision;

      // Transform incoming operation against all pending operations
      let transformedOp = { ...operation };
      fileState.pendingOps.forEach((pendingEntry) => {
        if (pendingEntry.revision >= clientRevision) {
          transformedOp = transform(pendingEntry.op, transformedOp);
        }
      });

      // Apply transformed operation to current content
      fileState.content = applyOperation(fileState.content, transformedOp);

      // Add transformed op to pending (for future transforms)
      fileState.revision += 1;
      const appliedRevision = fileState.revision;
      fileState.pendingOps.push({
        revision: appliedRevision,
        op: transformedOp,
      });

      // Clean up old operations (keep last 100)
      if (fileState.pendingOps.length > 100) {
        fileState.pendingOps = fileState.pendingOps.slice(-100);
      }

      // Broadcast transformed operation to all OTHER users
      socket.to(getWorkspaceRoom(workspaceId)).emit("file:edited", {
        workspaceId,
        fileId,
        operation: transformedOp, // Send operation, not full content
        userId,
        revision: appliedRevision,
        timestamp: timestamp || new Date().toISOString(),
      });

      socket.emit("op:ack", {
        fileId,
        revision: appliedRevision,
      });

      console.log(`File ${fileId} operation applied:`, transformedOp);
    },
  );

  socket.on("file:open", ({ fileId, initialContent }) => {
    if (!fileId) return;

    if (!fileStates[fileId]) {
      fileStates[fileId] = {
        content: initialContent || "",
        pendingOps: [],
        revision: 0,
      };
    }

    // Send current state to this user
    socket.emit("file:state", {
      fileId,
      content: fileStates[fileId].content,
      revision: fileStates[fileId].revision,
    });

    console.log(`File ${fileId} state sent to user`);
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }
    console.log("A user disconnected", socket.id);
  });
});

/**
 * Auto-save: persist file states to database every 5 seconds
 */
setInterval(async () => {
  const FileNode = require("../models/fileNode");

  for (const [fileId, state] of Object.entries(fileStates)) {
    try {
      await FileNode.findByIdAndUpdate(
        fileId,
        {
          content: state.content,
          updatedAt: new Date(),
        },
        { new: true },
      );
      console.log(`Auto-saved file ${fileId}`);
    } catch (error) {
      console.error(`Error auto-saving file ${fileId}:`, error);
    }
  }
}, 5000);

const getSocketIdFromUserId = (receiverId) => {
  return userSocketMap[receiverId];
};

module.exports = { io, app, server, getSocketIdFromUserId };
