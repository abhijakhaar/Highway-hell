const express = require("express");

const { register , login,changePassword, verify } = require("../controllers/auth.js");
const { verifyToken } = require("../middlewares/auth.js");


const router = express.Router();
router.post("/login", login);
router.post("/signup" , register);
router.put("/change-password",verifyToken,changePassword);
router.get("/verify", verify);
module.exports = router;