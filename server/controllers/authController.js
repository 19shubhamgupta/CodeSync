exports.createUser = async (req, res) => {
    try{
        const { clrek_user_id, userName, email, password } = req.body;
        const newUser = new User({ clrek_user_id, userName, email, password });
        await newUser.save();
        res.status(201).json(newUser);
    }catch(error){
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};