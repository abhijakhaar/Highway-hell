const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
require("dotenv").config();

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
console.log(EMAIL);
console.log(PASSWORD);
const sendGmail = async (name, useremail, token, password , username) => {
  const verificationLink = `http://localhost:3001/auth/verify?token=${token}&name=${name}&password=${password}&username=${username}&useremail=${useremail}`;
console.log("655");
  let config = {
    service: "gmail",
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  };
  console.log("656");
  let transporter = nodemailer.createTransport(config);
console.log("67676");
  let MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Diddy's Minions",
      link: "https://mailgen.js/",
    },
  });
console.log("6534556");
  let response = {
    body: {
      name: name,
      intro: "Welcome! Please verify your account.",
      action: {
        instructions: "Click the button to verify your account:",
        button: {
          color: "#22BC66",
          text: "Confirm your account",
          link: verificationLink,
        },
      },
      outro: "Need help? Just reply to this email.",
    },
  };
console.log("6552345");
  let mail = MailGenerator.generate(response);
  let message = {
    from: EMAIL,
    to: useremail,
    subject: "Verify your account",
    html: mail,
  };
console.log("6551234567");
  return transporter.sendMail(message);
  // console.log("655123434");
};
//Registration
const register = async (req, res) => {
  try {
    console.log("70");
    const { useremail, name, password, username } = req.body;
    const token = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("63");
    await sendGmail(name, useremail, token, password , username);
console.log("644");
    // const salt = crypto.randomBytes(16).toString("hex");
    // const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
    //   const newUser = new User({
    //     username,
    //     useremail,
    //     name,
    //     password: `${salt}:${passwordHash}`,
    //   });
    //   const savedUser = await newUser.save();
    //   res.status(201).json(savedUser);
    res.json({
      success: true,
      message:
        "Verification email sent. Please verify to complete registration.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




const verify = async (req , res) => {
   const { token, name, password, username, useremail } = req.query;
  // const name = req.body.name;
  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const { useremail } = decoded;

    // Check if user already exists (in case verification is attempted multiple times)
    let user = await User.findOne({ useremail });
    if (user)
      return res.status(400).json({ message: "Email already verified." });

    // Create the user in the database with email
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");

    await User.create({
      username,
      useremail,
      name: name,
      password: `${salt}:${hashedPassword}`,
    });

    // res.redirect("http://localhost:3000/login");
    res
      .status(200)
      .json({ success: true, message: "Verification successful." });
  } catch (error) {
    console.error(error);
    res.status(400).send("Invalid or expired verification link.");
  }
};

/* LOGGING IN */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ useremail: email });
    if (!user) return res.status(400).json({ msg: "User does not exist." });

    // Password verification
    const [salt, storedHash] = user.password.split(":");
    const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
    if (passwordHash !== storedHash) {
      return res.status(400).json({ msg: "Invalid credentials." });
    }

    // Get full user data with population
    const fullUser = await User.findById(user._id)
      .select("-password -createdAt -updatedAt")
      .populate({
        path: "friends",
        select: "username name profileImage",
      })
      .lean(); // Convert to plain object

    // Remove version key
    delete fullUser.__v;

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(200).json({
      token,
      user: fullUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Adjust the path to your User model

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user is authenticated & ID is extracted from token middleware
    const { currentPassword, newPassword } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract salt and hashed password from stored password
    const [salt, storedHash] = user.password.split(":");

    // Hash the entered current password using the stored salt
    const enteredHash = crypto
      .scryptSync(currentPassword, salt, 64)
      .toString("hex");

    // Compare hashes
    if (enteredHash !== storedHash) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Generate a new salt and hash the new password
    const newSalt = crypto.randomBytes(16).toString("hex");
    const newPasswordHash = crypto
      .scryptSync(newPassword, newSalt, 64)
      .toString("hex");

    // Update password in the database
    user.password = `${newSalt}:${newPasswordHash}`;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  changePassword,
  verify,
};
