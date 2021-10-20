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

    io.emit('chat message', nickname + " has entered the chat.");
  });

  socket.on('disconnect', () => {
    console.log('a user has disconnected');
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', socket.username + ": " + msg);
  });
});

server.listen(3000, () => {  
  console.log('listening on *:3000');
});