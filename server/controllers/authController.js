import User from "../models/user.js";

export const createUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    const clrek_user_id = req.user.sub;
    const newUser = new User({ clrek_user_id, userName, email, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
