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

app.get('/jaanchat', (req, res) => {  
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  socket.on('nickname',(nickname) => {
    if(!nickname.trim() || !nickname)
        nickname = "Anonymous";
    socket.username = nickname;

    io.emit('chat message', socket.username + " has entered the chat.");
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('chat message', socket.username + " has disconnected.");
  });

  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', socket.username + ": " + msg);
  });

  socket.on('typing', () => {
    socket.broadcast.emit("typing", socket.username);
  });

  socket.on('not typing', () => {
    socket.broadcast.emit("not typing", socket.username);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});