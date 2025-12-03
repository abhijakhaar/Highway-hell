const User = require("../models/User.js");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const fs = require("fs");

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -createdAt -updatedAt")
      .populate({
        path: "friends",
        select: "username name profileImage", // Customize friend fields
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert Mongoose document to plain object and remove version key
    const userObject = user.toObject();
    delete userObject.__v;

    res.status(200).json(userObject);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's friends
const getUserFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).populate("friends", "name profileImage");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const friendsData = user.friends.map(friend => ({
      id: friend._id,
      name: friend.name,
      imageUrl: friend.profileImage || "https://randomuser.me/api/portraits/men/32.jpg",
    }));
    
    res.json(friendsData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add/Remove friend
const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const [user, friend] = await Promise.all([
      User.findById(id),
      User.findById(friendId)
    ]);

    if (user.friends.includes(friendId)) {
      // Remove friendship both ways
      user.friends.pull(friendId);
      friend.friends.pull(id);
    } else {
      // Add friendship both ways
      user.friends.push(friendId);
      friend.friends.push(id);
    }

    await Promise.all([user.save(), friend.save()]);

    // Get updated friends list with populated data
    const updatedUser = await User.findById(id).populate({
      path: 'friends',
      select: '_id username name profileImage '
    });

    const formattedFriends = updatedUser.friends.map((friend) => ({
      _id: friend._id,
      username: friend.username,
      name: friend.name,
      profileImage: friend.profileImage
    }));

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

   
   

    // Convert to plain object
    const updateDP = async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
    
        // Debug: Check req.user content
    
        // Ensure req.user exists and has a valid _id
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "Unauthorized" });
        }
    
        const userId = req.user.id; // Use _id instead of id if necessary
    
        // Upload to Cloudinary and update user as before
        const localFilePath = req.file.path;
        const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
    
        if (!cloudinaryResponse) {
          return res.status(500).json({ message: "Failed to upload image" });
        }
    
        const { secure_url } = cloudinaryResponse;
    
        const user = await User.findByIdAndUpdate(
          userId, // Should now be a valid ObjectId
          { profileImage: secure_url },
          { new: true }
        );
    
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        return res.status(200).json({
          message: "Profile image updated successfully",
          profileImage: secure_url,
        });
      } catch (error) {
        console.error("Error updating profile image:", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    };



 

    const updateUserProfile = async (req, res) => {
      try {
        const userId = req.params.id; // Extract the user ID from the URL
        const updateData = req.body; // Get the update payload from the request body
    
        // Validate if the user exists
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        // Update user data
        Object.assign(user, updateData); 
        const updatedUser = await user.save(); // Save to DB
    
        // Return updated user data
        res.status(200).json({
          message: "Profile updated successfully",
          data: {
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            location: updatedUser.location,
            occupation: updatedUser.occupation,
            about: updatedUser.about,
            connect: updatedUser.connect,
            profileImage: updatedUser.profileImage,
          },
        });
      } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    };



    

    const addFriend = async (req , res) => {
      console.log('989');
      const { friendId } = req.body;
      const userId = req.user.id;

      try {
        const sender = await User.findById(userId);
        const senderName = sender?.name || "Unknown User";
        const senderEmail = sender?.useremail;

        // Ensure that friendId is not the same as userId
        if (friendId === userId) {
          return res
            .status(400)
            .json({ error: "You cannot add yourself as a friend." });
        }

        // Check if friend exists
        const friend = await User.findById(friendId);
        if (!friend) {
          return res.status(404).json({ error: "User not found." });
        }

        // Check if they are already friends
        if (friend.friends.includes(userId)) {
          return res
            .status(400)
            .json({ error: "This user is already your friend." });
        }

        // Check if a friend request is already pending
        const isRequestPending = friend.notifications.some(
          (notification) =>
            notification.title === "New Friend Request" &&
            notification.message.includes(senderEmail) &&
            !notification.read
        );

        if (isRequestPending) {
          return res
            .status(400)
            .json({ error: "A friend request is already sent." });
        }

        // Send friend request notification to the friend
        const newNotification = {
          title: "New Friend Request",
          message: `${senderName} has sent you a friend request. Email is ${senderEmail}`,
          actionLink: `/accept-friend-request/${userId}`,
          read: false,
        };

        await User.findByIdAndUpdate(friendId, {
          $push: { notifications: newNotification },
        });

        return res
          .status(200)
          .json({ success: true, message: "Friend request sent." });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error." });
      }
    };






    
// Add this route to handle friend acceptance


const acceptedFriendInvite = async (req , res) => {
  const {  notificationId , friendId} = req.body;
  const userId = req.user.id;

  try {
    if (friendId === userId) {
      console.log("1234");
      
      return res.status(400).json({ success : false , error: "You cannot be friends with yourself." });
    }

    // Ensure user and friend both exist
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      console.log("123");
      console.log(friend);
      console.log(user);
      return res.status(404).json({ success: false, error: "User not found." });
    }

    // Add each user to the other's friend list
    await User.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } });

    // Remove the notification after friend request is accepted
    await User.findByIdAndUpdate(userId, {
      $pull: { notifications: { _id: notificationId } },
    });

    res.status(200).json({ success: true, message: "Friend request accepted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
    

const deniedFriendInvite = async (req, res) => {
  const { notificationId } = req.body;
  const userId = req.user.id;

  try {
    // Remove the friend request notification
    await User.findByIdAndUpdate(userId, {
      $pull: { notifications: { _id: notificationId } },
    });

    res.status(200).json({ success: true, message: "Friend request denied." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





const removeFriend = async (req , res) => {
  console.log("24");
  const userId = req.user.id; // Decoded user ID from token
  const { useremail } = req.body;

  try {
    // Find friend by email
    console.log(useremail);
console.log("25");
    const friend = await User.findOne({ useremail });
    if (!friend) {
      return res.status(404).json({ error: "Friend not found1" });
    }

    // Remove friend from user's friend list
    await User.findByIdAndUpdate(userId, { $pull: { friends: friend._id } });

    // Remove user from friend's friend list
    await User.findByIdAndUpdate(friend._id, { $pull: { friends: userId } });

    res.json({ success: true, message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ error: "Failed to remove friend" });
  }
};
module.exports = {
  getUser,
  getUserFriends,
  addRemoveFriend,
  updateDP,
  updateUserProfile,
  addFriend,
  acceptedFriendInvite,
  deniedFriendInvite,
  removeFriend,
};