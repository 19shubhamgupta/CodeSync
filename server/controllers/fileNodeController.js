const { io } = require("../lib/socket");
const FileNode = require("../models/fileNode");

exports.createFileNode = async (req, res) => {
  try {
    const { name, type, parentId, workspaceId, language } = req.body;
    const userId = req.user?.mongoId;
    let runnable = false;
    if(type === "file" && language) runnable = true; 

    if (!name || !workspaceId) {
      return res
        .status(400)
        .json({ message: "Name and workspaceId are required" });
    }
    const newNode = new FileNode({
      name,
      language: language || undefined,
      type: type || "folder",
      parentId: parentId || null,
      workspaceId,
      isRunnable : runnable,
      runType : language,
      lastEditedBy: userId,
    });
    await newNode.save();
    return res.status(201).json({
      message: "File node created successfully",
      fileNode: newNode,
    });
  } catch (error) {
    console.error("Error creating file node:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getFileNodes = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ message: "WorkspaceId required" });
    }

    const parentId = req.query.parentId || null;
    const files = await FileNode.find({ workspaceId, parentId });

    return res.status(200).json({
      message: "File nodes fetched successfully",
      files,
    });
  } catch (error) {
    console.error("Error fetching file nodes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateFileNode = async (req, res) => {
  try {
    const fileNodeId = req.params.id;
    if (!fileNodeId) {
      return res.status(400).json({ message: "FileNode id required" });
    }

    const fileNodeDoc = await FileNode.findById(fileNodeId);
    if (!fileNodeDoc) {
      return res.status(400).json({ message: "No such File exists" });
    }

    const update = { ...req.body };
    delete update._id;
    delete update.__v;

    const userId = req.user?.mongoId;
    if (userId) {
      update.lastEditedBy = userId;
    }

    console.log("Req came to update: ", userId, update);
    const updatedNode = await FileNode.findByIdAndUpdate(fileNodeId, update, {
      new: true,
      runValidators: true,
    });

    if (!updatedNode) {
      return res.status(404).json({ message: "File node not found" });
    }

    if (Object.prototype.hasOwnProperty.call(update, "content")) {
      io.to(`workspace:${fileNodeDoc.workspaceId}`).emit("file:saved", {
        fileId: updatedNode._id.toString(),
        userId,
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(200).json({
      message: "File node updated successfully",
      fileNode: updatedNode,
    });
  } catch (error) {
    console.error("Error updating file node:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
