const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require("path");
const { isUndefined } = require("util");
const mysql = require('mysql');

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/chatroom.html");
});

app.get("/hello", (req, res) => {
  res.sendFile(__dirname + "/public/chatroom.html");
});

app.get("/chatroom", (req, res) => {
  res.sendFile(__dirname + "/public/chatroom.html");
});

const database_connection = mysql.createConnection({
  host: 'localhost',
  user: 'wassup',
  password: 'hello123',
  database: 'chatroom'
});

database_connection.connect(function(e) {
  if (e) throw e;
  console.log("Database Connected!");
});

function saveMessage(sql){
  database_connection.query(sql, function (e, res){
  if (e) throw e;  
  });
}

io.of("/hello").on("connection", (socket) => {
  console.log("hello world1!!1");
});


//when a user establishes a new connection
io.of("/").on("connection", (socket) => {
  socket.on("nickname", (nickname) => {
    if (!nickname.trim() || !nickname) {
      nickname = "Anonymous";
    }

    if (nickname.length > 15) {
      nickname = nickname.substring(0, 14);
    }

    socket.username = nickname;

    database_connection.query("SELECT * FROM messages WHERE chatroom_id = 1 and is_private = false order by message_id desc limit 50", function (e, res){
      if (e) throw e;
      io.emit("load previous messages", res);
      io.emit("chat message", socket.username + " has entered the chat.");
    });

    
    checkConnectedUsers();

    

  });

  //when the user disconnects
  socket.on("disconnect", () => {
    if (socket.username != undefined) {
      socket.broadcast.emit(
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

    const usernameIterator = io.of("/").sockets.keys();
    const connectedUsers = [];

    for (const name of usernameIterator) {
      if (io.of("/").sockets.get(name).username != undefined) {
        connectedUsers.push(io.of("/").sockets.get(name).username);
      }
    }

    io.emit("whoIsOnline", connectedUsers);
    return;
  }

  //when the user sends a chat message
  socket.on("chat message", (message) => {
    socket.broadcast.emit("chat message", socket.username + ": " + message);
    let sql_query = "INSERT INTO messages (chatroom_id, sent_by, message, is_private) VALUES(1," + mysql.escape(socket.username) + "," + mysql.escape(message) + ",false)";
    saveMessage(sql_query);
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
    let sql_query = "INSERT INTO messages (chatroom_id, sent_by, message, is_private, sent_to) VALUES(1," + mysql.escape(socket.username) + "," + mysql.escape(message)
     + ",true, " + mysql.escape(sendTo) + ")";
     saveMessage(sql_query);
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

server.listen(3000, () => {});
