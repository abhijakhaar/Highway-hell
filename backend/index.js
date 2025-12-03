const express = require("express");
const connectDB = require("./db/db");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth.js");
const tripRoutes = require("./routes/trip.js");
const chatRoutes = require("./routes/chat.js");
const messageRoutes = require("./routes/message.js");
var cors = require("cors");
const userRoutes = require("./routes/User.js");
//const User = require("./models/User.js");


// Load environment variables
dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/trip", tripRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use("/users", userRoutes);


// Connect to MongoDB


connectDB();

const PORT = process.env.PORT || 6000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


const io = require("socket.io")(server , {
  pingTimeout: 60000,
  cors :{
    origin: "http://localhost:5173",
  },
});
global.io = io;

io.on("connection" , (socket) => {
  console.log("connected to the socket.io");
  socket.on("join", ({ userId }) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });
  // socket.emit("notificationReceived", { message: "Test notification" });
  
});