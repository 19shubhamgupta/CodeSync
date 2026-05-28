const express = require("express");
const { createUser } = require("../controllers/authController");
const verifyClerkToken = require("../middleware/verifyClerkToken");

const router = express.Router();

router.post("/users", verifyClerkToken, createUser);

module.exports = router;
