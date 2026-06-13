import mongoose from "mongoose";

const fileNodeSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FileNode",
      default: null,
    },
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "folder"] },

    // Only for files
    language: String,
    content: String,
    isRunnable: {
      type: Boolean,
      default: false,
    },
    runType: {
      type: String,
    },
    // Only for folders
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FileNode",
      },
    ],

    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("FileNode", fileNodeSchema);
