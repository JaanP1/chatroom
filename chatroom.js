const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require("path");
const { isUndefined } = require("util");
// const mysql = require('mysql');
const database = require('./database');
const bodyParser = require("body-parser");

console.log("Server Start");
let roomName = null;
let chatroom_id = null;
let is_saved = false;
let isPassEnter = false;
let preloadedMessages = null;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/:id", async (req, res) => {
  roomName = req.params.id;
  database.databaseInitialise();
  if (!chatroom_id){
    chatroom_id = await database.getChatroomId(roomName);
  }

  is_saved = await database.isSaved(roomName);

  if (is_saved && !preloadedMessages){
    preloadedMessages = await database.getMessages(chatroom_id);
  }
  const badName = new Set(["password", "createroom", "login", "index","pass-form"]);

  if(badName.has(roomName.toLowerCase())){
    res.redirect("/");
  }

  let isPassRequired = await database.checkPasswordRequirement(roomName);
  if (isPassRequired && !isPassEnter){
    res.sendFile(__dirname + "/public/login.html");
  }
  else{
    isPassEnter = false;
    res.sendFile(__dirname + "/public/chatroom.html");
  }

});

app.post("/", (req, res) => {
  roomName = req.body.eroom;
  if (roomName.trim()){
    res.redirect(roomName);
  }
});

app.post("/createroom", async (req, res) => {
  let body = req.body;
  roomName = body.croom;
  if (roomName.trim()){
    database.databaseInitialise();
    await database.createNewChatroom(roomName, body.pass == "on" ? true : false , body.password, body.save == "on" ? true : false);
    isPassEnter = body.pass == "on" ? true : false;
    chatroom_id = await database.getChatroomId(roomName);
    is_saved = await database.isSaved(roomName);
    if (is_saved){
      preloadedMessages = await database.getMessages(chatroom_id);
      //console.log("this is prelaoded" , preloadedMessages);
    }
    res.redirect(roomName);
  }
});

app.post("/pass-form", async (req, res) => {
  isPassEnter = await database.checkPassword(roomName, req.body.passinput);
  res.redirect(roomName);
});

//Chat room sockets
//when a user establishes a new connection
io.of("/").on("connection", (socket) => {
  socket.join(roomName);

  socket.roomName = roomName;
  socket.on("nickname", (nickname) => {
    if (!nickname.trim() || !nickname) {
      nickname = "Anonymous";
    }

    if (nickname.length > 15) {
      nickname = nickname.substring(0, 14);
    }

    socket.username = nickname;

    database.databaseInitialise();
    database.createNewChatroom(roomName);

    checkConnectedUsers();
    socket.to(socket.roomName).emit("chat message", socket.username + " has entered the chat.");
    if(preloadedMessages){
      socket.emit("load previous messages", preloadedMessages);
    }
  });

  //when the user disconnects
  socket.on("disconnect", () => {
    if (socket.username != undefined) {
      socket.to(socket.roomName).emit(
        "chat message",
        socket.username + " has disconnected."
      );
    }

    checkConnectedUsers();
  });

  function checkConnectedUsers() {
    if (socket.username == undefined || socket.username == null) {
      return;
    }
    
    io.in(roomName).allSockets().then(function(value){
      let connectedUsers = [];
      for (const name of value){
        if (io.of("/").sockets.get(name).username != undefined) {
          connectedUsers.push(io.of("/").sockets.get(name).username);
        }
      }
      io.to(socket.roomName).emit("whoIsOnline", connectedUsers, roomName);
    });
    return;
  }

  //when the user sends a chat message
  socket.on("chat message", (message) => {
    socket.broadcast.to(socket.roomName).emit("chat message", socket.username + ": " + message);
    if(is_saved){
      database.insertMessage(chatroom_id, socket.username, message, false);
    }
  });

  // private messaging
  socket.on("private message", (sendTo, message) => {
    const usernameIterator = io.of("/").sockets.keys();
    let id;
    for (const user of usernameIterator) {
      if (io.of("/").sockets.get(user).username == sendTo) {
        id = user;
      }
    }
    socket.to(id).emit("private message", socket.username, message);
  });

  //when the user is typing
  socket.on("typing", () => {
    socket.broadcast.to(socket.roomName).emit("typing", socket.username);
  });

  //when the user stops typing
  socket.on("not typing", () => {
    socket.broadcast.to(socket.roomName).emit("not typing", socket.username);
  });
});

server.listen(3000, () => {});