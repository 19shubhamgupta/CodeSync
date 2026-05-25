const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    clrek_user_id : {
        type : String,
        unique : true,
        required : true
    },
    userName : {
        type : String,
        unique : true,
    },
    email : {
        type : String,
        unique : true,
    },
    password : {
        type : String
    },
    githubToken: {
        type : String
    },
    githubUsername: {
        type : String
    }
    }, { timestamps : true }
);


const User = mongoose.model("User", userSchema);

module.exports = User;