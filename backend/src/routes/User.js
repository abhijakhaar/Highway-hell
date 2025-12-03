const express = require("express");
const {
  getUser,
  getUserFriends,
  addRemoveFriend,
  updateDP,
  updateUserProfile,
  addFriend,
  acceptedFriendInvite,
  deniedFriendInvite,
  removeFriend,
} = require("../controllers/user.js");
const { verifyToken } = require("../middlewares/auth");
const { upload } = require("../middlewares/multer");

const router = express.Router();

//router.get("/:id/friends",  getUserFriends);

/* UPDATE */
router.post(
  "/upload/profile",
  verifyToken,
  upload.single("profileImage"),
  updateDP
);
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);
router.put("/update-user/:id", verifyToken, updateUserProfile);
router.post("/add-friend", verifyToken, addFriend);
router.post("/removeFriend", verifyToken, removeFriend);
router.post("/accept-friend-request", verifyToken, acceptedFriendInvite);
router.post("/deny-friend-request", verifyToken, deniedFriendInvite);
router.get("/:id/get", verifyToken, getUser);
module.exports = router;
