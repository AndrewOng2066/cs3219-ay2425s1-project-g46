// Author(s): Xue Ling, Xiu Jia
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const port = process.env.PORT || 5003;

const collaborationRoute = require("./routes/collaborationRoute");

// Import the socket handler
const { handleSocketIO } = require("./handler/socketHandler.js");

// Create an HTTP server that works with both Express and Socket.IO
const server = http.createServer();

// Initialize the Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins, adjust as needed
    methods: ["GET", "POST"],
  },
});

// Trigger handleSocketIO to start listening for Socket.IO events
handleSocketIO(io); // This calls the function to set up the socket listeners

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/collaboration", collaborationRoute);

app.listen(5004, () => {
  console.log(`Example app listening on port ${5004}`);
});