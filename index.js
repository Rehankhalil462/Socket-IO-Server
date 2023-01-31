const port = process.env.PORT || 3000;

const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

let connectedUsers = [];

io.on("connection", (socket) => {
  const connectedUser = {
    id: socket.id,
    count: 0,
  };

  connectedUsers.push(connectedUser);
  connectedUsers.sort((a, b) => a.count - b.count);

  socket.on("disconnect", () => {
    connectedUsers = connectedUsers.filter((user) => user.id !== socket.id);
  });

  // Listen for data request from the client
  socket.on("server-message", (msg) => {
    let availableUsers = connectedUsers.filter((user) => user.count < 5);

    if (availableUsers.length > 0) {
      let leastCountUser = availableUsers.sort((a, b) => a.count - b.count)[0];

      if (leastCountUser.count < 5) {
        leastCountUser.count++;
        io.to(leastCountUser.id).emit("image-review-data", msg);
      }
    }
  });
  socket.on("image-resolve-data", (msg) => {
    connectedUsers.map((user) => {
      if (user.id === socket.id) {
        return { ...user, count: user.count - 1 };
      } else {
        return user;
      }
    });
    io.emit("server-data", msg);
  });
});

server.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
