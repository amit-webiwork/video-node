const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const uuid = require('uuid');


const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
  ],

  allowedHeaders: [
    'Content-Type',
  ],
};

app.use(cors(corsOpts));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Running");
});

io.on("connection", (socket) => {
  let allUsers = []; // All users in current chat room

  socket.on("startConference", ({ name, type }) => {
    socket.emit("me", socket.id);
  });

  socket.on("updateMyMedia", ({ type, currentMediaStatus }) => {
    console.log("updateMyMedia");
    socket.broadcast.emit("updateUserMedia", { type, currentMediaStatus });
  });

  socket.on("msgUser", ({ name, to, msg, sender }) => {
    io.to(to).emit("msgRcv", { name, msg, sender });
  });

  socket.on("joinConference", ({ userToCall, signalData, from, name }) => {
    console.log(userToCall, signalData, from, name, 'joinConference')
    io.to(userToCall).emit("joinConference", {
      signal: signalData,
      from,
      name,
    });
  });

  socket.on("joinedConference", (data) => {
    console.log(data, 'joinedConference')
    socket.broadcast.emit("updateUserMedia", {
      type: data.type,
      currentMediaStatus: data.myMediaStatus,
    });
    io.to(data.to).emit("joinedConferenceDone", data);
  });




  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("callUser", {
      signal: signalData,
      from,
      name,
    });
  });

  socket.on("answerCall", (data) => {
    socket.broadcast.emit("updateUserMedia", {
      type: data.type,
      currentMediaStatus: data.myMediaStatus,
    });
    io.to(data.to).emit("callAccepted", data);
  });

  socket.on("endCall", ({ id }) => {
    io.to(id).emit("endCall");
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
