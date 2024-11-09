// Author(s): Xiu Jia
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { handleSocketIO } = require("./handler/socketHandler.js");
const apiRoute = require("./routes/apiGatewayRoute.js");

const port = process.env.PORT || 8000;

// Create an instance of Express app
const app = express();
const server = http.createServer(app);

// Initialize the Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins, adjust as needed
    methods: ["GET", "POST"],
  },
});

handleSocketIO(io);

app.use(express.json());
app.use(cors());

// default API from expressJS
app.get("/", (req, res) => {
  res.send("Welcome to the Express server!");
});

// Route
app.use("/api", apiRoute);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});