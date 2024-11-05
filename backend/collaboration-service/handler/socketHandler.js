// Author(s): Xue Ling, Xiu Jia, Calista
const {
  getRandomQuestion,
  getComplexity,
} = require("../service/questionService");
const db = require("../config/firebase");

let socketMap = {};
let intervalMap = {};

let latestContentText = {};
let latestContentCode = {};
let latestLanguage = {};
let haveNewData = {};
let activeUserInRoom = {}; // track user details in rooms
let submitStatus = {};
let activeIdInRoom = {}; //track socket ids in rooms

const handleSocketIO = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected with socket ID: ${socket.id}`);

    socket.on("createSocketRoom", async ({ data, id, currentUser }) => {
      // Store the socket id for the user
      socketMap[currentUser] = socket.id;
      socket.roomId = id;

      socket.join(id);
      console.log(`User with socket ID ${socket.id} joined room with ID ${id}`);
      if (!activeIdInRoom[id]) {
        activeIdInRoom[id] = []; // Initialize as an empty array
      }
      activeIdInRoom[id].push(socket.id);

      console.log(`UactiveUserInRoom[id]: ${activeIdInRoom[id].length}`);

      const room = io.sockets.adapter.rooms.get(id);

      if (room && room.size === 2) {
        const { user1, user2 } = data;

        const complexity = getComplexity(user1, user2);

        const questionData = await getRandomQuestion(
          user1.category,
          complexity
        );

        activeUserInRoom[id] = {
          user1: user1,
          user2: user2,
          questionData: questionData,
          length: 2,
        };

        io.in(id).emit("readyForCollab", {
          id: id,
          user1,
          user2,
          questionData,
        });

        if (!submitStatus[id]) {
          submitStatus[id] = { user1: false, user2: false };
        }

        console.log(
          `Room ${id} is ready. Collaboration question sent: ${questionData}`
        );

        // a timer to backup the current collab data
        const interval = setInterval(async () => {
          updateCollabData(id);
        }, 5000);

        intervalMap[id] = interval;
      }
    });

    socket.on("sendContent", ({ id, content }) => {
      haveNewData[id] = true;
      latestContentText[id] = content;

      socket.to(id).emit("receiveContent", { content: content });
    });

    socket.on("sendCode", ({ id, code }) => {
      haveNewData[id] = true;
      latestContentCode[id] = code;
      socket.to(id).emit("receiveCode", { code: code });
    });

    socket.on("languageChange", ({ id, language }) => {
      haveNewData[id] = true;
      latestLanguage[id] = language;
      socket.to(id).emit("languageChange", { language });
    });

    // Handle submission
    socket.on("endSession", () => {
      if (socket.id === activeIdInRoom[socket.roomId][0]) {
        submitStatus[socket.roomId].user1 = true;
      } else if (socket.id === activeIdInRoom[socket.roomId][1]) {
        submitStatus[socket.roomId].user2 = true;
      }
      console.log(submitStatus);
      if (submitStatus[socket.roomId].user1 && submitStatus[socket.roomId].user2) {
        console.log("Both users have submitted in room:", socket.roomId);
        updateCollabData(socket.roomId);
        activeUserInRoom[socket.roomId].length = 0;
        io.to(socket.roomId).emit('sessionEnded');
        socket.disconnect();
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("disconnecting...");
      const activeUsers = activeUserInRoom[socket.roomId];
      if (!activeUsers || activeUsers.length === 0) {
        console.log(`No active users in room: ${socket.roomId}`);
      } else {
        activeUserInRoom[socket.roomId].length =
        Math.max(0, activeUserInRoom[socket.roomId].length - 1);;

        if (activeUserInRoom[socket.roomId].length == 0) {
          console.log(
            `All users in roomId ${socket.roomId} disconnected, deleting room data`
          );
          delete activeUserInRoom[socket.roomId];
          delete activeIdInRoom[socket.roomId];

          clearInterval(intervalMap[socket.roomId]);
          delete intervalMap[socket.roomId];
          delete latestContentText[socket.roomId];
          delete latestContentCode[socket.roomId];
          delete latestLanguage[socket.roomId];
          delete haveNewData[socket.roomId];
        }

        for (let user in socketMap) {
          if (socketMap[user] === socket.id) {
            delete socketMap[user];
            break;
          }
        }
        console.log(
          `User with socket ID ${socket.id} disconnected, leaving ${socket.roomId}`
        );
      }
    });
  });
};

async function updateCollabData(id) {
  const currentTime = new Date().toISOString();
  const currentContentText = latestContentText[id];
  const currentContentCode = latestContentCode[id];
  const currentLanguage = latestLanguage[id] || null;
  const user1 = activeUserInRoom[id].user1;
  const user2 = activeUserInRoom[id].user2;
  const questionData = activeUserInRoom[id].questionData;
  const periodicData = {
    user1,
    user2,
    questionData,
    currentLanguage,
    currentContentText,
    currentContentCode,
    timestamp: currentTime,
  };

  try {
    const collabRef = db.collection("collabs").doc(id);
    const doc = await collabRef.get();

    if (doc.exists) {
      if (haveNewData[id]) {
        haveNewData[id] = false;
        await collabRef.update(periodicData);
        console.log(
          `Collab Data for roomid ${id} updated to Firebase at ${currentTime}`
        );
      }
    } else {
      await collabRef.set({
        roomId: id,
        ...periodicData,
      });
      console.log(
        `New Collab page for roomid ${id} recorded to Firebase at ${currentTime}`
      );
    }
  } catch (error) {
    console.error("Fail to save to database: ", error);
  }
}
// Export user functions
module.exports = { handleSocketIO };
