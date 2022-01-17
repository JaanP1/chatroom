const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

app.use(
  express.static(path.join(__dirname, 'public'))
);

app.get('/', (req, res) => {  
  res.sendFile(__dirname + '/public/chatroom.html');
});

//when a user establishes a new connection
io.on('connection', (socket) => {
  socket.on('nickname',(nickname) => {
    if(!nickname.trim() || !nickname)
        nickname = "Anonymous";
    socket.username = nickname;

    io.emit('chat message', socket.username + " has entered the chat.");
    io.emit('whoIsOnline', checkConnectedUsers());
  });

  //when the user disconnects
  socket.on('disconnect', () => {
    socket.broadcast.emit('chat message', socket.username + " has disconnected.");
    io.emit('whoIsOnline', checkConnectedUsers());
  });

  function checkConnectedUsers(){
    const usernameIterator = io.of('/').sockets.keys();
    const connectedUsers = [];
    for(const name of usernameIterator){
      connectedUsers.push(io.of('/').sockets.get(name).username);
    }

    return connectedUsers;
  };

  //when the user sends a chat message
  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', socket.username + ": " + msg);
  });

  //when the user is typing
  socket.on('typing', () => {
    socket.broadcast.emit("typing", socket.username);
  });

  //when the user stops typing
  socket.on('not typing', () => {
    socket.broadcast.emit("not typing", socket.username);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});