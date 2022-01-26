const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require("path");
const { isUndefined } = require("util");

app.use(
  express.static(path.join(__dirname, "public"))
);

app.get("/", (req, res) => {  
  res.sendFile(__dirname + "/public/chatroom.html");
});

//when a user establishes a new connection
io.on("connection", (socket) => {
  socket.on("nickname",(nickname) => {
    if(!nickname.trim() || !nickname){
        nickname = "Anonymous";
    }

    if(nickname.length > 15){
      nickname = nickname.substring(0, 14);
    }

    socket.username = nickname;

    io.emit("chat message", socket.username + " has entered the chat.");
    checkConnectedUsers();
  });

  //when the user disconnects
  socket.on("disconnect", () => {
    if(socket.username != undefined){
      socket.broadcast.emit("chat message", socket.username + " has disconnected.");
    }

    checkConnectedUsers();
  });

  function checkConnectedUsers(){
    if(socket.username == undefined || socket.username == null){
      return;
    }

    const usernameIterator = io.of("/").sockets.keys();
    const connectedUsers = [];
    for(const name of usernameIterator){
      console.log(typeof(io.of("/").sockets.get(name).username), io.of("/").sockets.get(name).username);
      if(io.of("/").sockets.get(name).username != undefined ){
        connectedUsers.push(io.of("/").sockets.get(name).username);
      }
    }

    io.emit("whoIsOnline", connectedUsers);
    return;
  };

  //when the user sends a chat message
  socket.on("chat message", (msg) => {
    socket.broadcast.emit("chat message", socket.username + ": " + msg);
  });

  socket.on("private message", (sendTo, message) => {
    const usernameIterator = io.of("/").sockets.keys();
    let id;
    for(const user of usernameIterator){
      if(io.of("/").sockets.get(user).username == sendTo){
        id = user;
      };
    }
    socket.to(id).emit("private message", socket.username, message);
  });

  //when the user is typing
  socket.on("typing", () => {
    socket.broadcast.emit("typing", socket.username);
  });

  //when the user stops typing
  socket.on("not typing", () => {
    socket.broadcast.emit("not typing", socket.username);
  });
});

server.listen(80, () => {
});