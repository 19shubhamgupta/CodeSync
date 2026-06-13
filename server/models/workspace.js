import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: { type: String },
  isPublic: { type: Boolean, default: false },
  shareLink: { type: String, unique: true, sparse: true },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["Admin", "Developer", "Visitor"] },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  githubIntegration: {
    isConnected: { type: Boolean, default: false },
    repoOwner: String,
    repoName: String,
    repoUrl: String,
    accessToken: String, // Encrypted
    branch: { type: String, default: "main" },
    linkedAt: Date,
    lastSyncedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Workspace", workspaceSchema);
