const Workspace = require("../models/workspace");
const User = require("../models/user");

exports.getWorkspaceByUserId = async (req, res) => {
  try {
    const userId = req.user?.mongoId;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const workspaceIds = [
      ...user.ownedWorkspaceIds.map((id) => id.toString()),
      ...user.memberWorkspaceIds.map((id) => id.toString()),
    ];

    if (workspaceIds.length === 0) {
      return res.status(200).json({
        message: "Workspace fetched successfully",
        workspaces: [],
      });
    }

    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });
    const enriched = workspaces.map((workspace) => {
      const isOwner = workspace.ownerId?.toString() === userId.toString();
      const member = workspace.members.find(
        (m) => m.userId?.toString() === userId.toString(),
      );
      return {
        ...workspace.toObject(),
        role: isOwner ? "Owner" : member?.role || "Member",
      };
    });
    return res.status(200).json({
      message: "Workspace fetched successfully",
      workspaces: enriched,
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.createWorkspace = async (req, res) => {
  try {
    const userId = req.user?.mongoId;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    const { name, description, isPublic, members } = req.body;
    const shareLink = `${process.env.BASE_URL}/join/${name}/${userId}`;
    const newWorkspace = {
      name,
      ownerId: userId,
      description,
      isPublic: isPublic || true,
      members: members || [],
      shareLink,
    };
    const workspace = new Workspace(newWorkspace);
    await workspace.save();

    await User.updateOne(
      { _id: userId },
      { $addToSet: { ownedWorkspaceIds: workspace._id } },
    );
    return res.status(201).json({
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getWorkspaceById = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    return res.status(200).json({
      message: "Workspace fetched successfully",
      workspace: workspace,
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.addMemberToWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { userId, role } = req.body;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    const isMember = workspace.members.some(
      (member) => member.userId.toString() === userId,
    );
    if (isMember) {
      return res
        .status(400)
        .json({ message: "User is already a member of the workspace" });
    }
    workspace.members.push({ userId, role });
    await workspace.save();

    await User.updateOne(
      { _id: userId },
      { $addToSet: { memberWorkspaceIds: workspace._id } },
    );
    return res.status(200).json({
      message: "Member added to workspace successfully",
      workspace: workspace,
    });
  } catch (error) {
    console.error("Error adding member to workspace:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
