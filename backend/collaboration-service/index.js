// Author(s): Xue Ling, Xiu Jia
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const port = process.env.PORT || 5003;

// Import the socket handler
const { handleSocketIO } = require("./handler/socketHandler.js");

// Import route
const collaborationRoute = require("./routes/collaborationRoute");

// Create an instance of Express app
const app = express();

// Create an HTTP server that works with both Express and Socket.IO
const server = http.createServer(app);

// Initialize the Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins, adjust as needed
    methods: ["GET", "POST"],
  },
});

// Trigger handleSocketIO to start listening for Socket.IO events
handleSocketIO(io); // This calls the function to set up the socket listeners

app.use(express.json());
app.use(cors());

// Routes
app.use("/collaboration", collaborationRoute);

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

