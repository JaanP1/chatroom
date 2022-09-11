console.log("Server Start");
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
const fs = require("fs");
const spr = require("@supercharge/strings");

let roomName = null;
let chatroom_id = {};
let is_saved = {};
let isPassEnter = false;
let preloadedMessages = {};
let connectedUsers = {};

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

async function getPreloadedMessages(chatroom_id){
  let rawMessages = await database.getMessages(chatroom_id);
  let cleanMessages = [];
  for(message of rawMessages){
    if(message['is_image']){
      const directory = path.join(message['directory'], message['file_name'] + '.' + message['file_type']);
      try{
        let imageFromFile = fs.readFileSync(directory, 'base64');
        let image64Url = 'data:image/' + message['file_type'] + ';base64,' + imageFromFile;
        cleanMessages.push([message['sent_by'], message['message'], message['is_image'], image64Url]);
      } catch(e){

      }
      
    } else{
      cleanMessages.push([message['sent_by'], message['message'], message['is_image']]);
    }
  }

  return cleanMessages;
}

app.get("/:id", async (req, res) => {
  roomName = req.params.id;
  const badName = new Set(["password", "createroom", "login", "index","pass-form"]);

  if(badName.has(roomName.toLowerCase())){
    res.redirect("/");
  }
  
  database.databaseInitialise();
  await database.createNewChatroom(roomName);
  let properties = await database.getProperties(roomName);
  chatroom_id[roomName] = properties[0];
  is_saved[roomName] = properties[1];
  
  if (is_saved[roomName]){
    preloadedMessages[roomName] = await getPreloadedMessages(chatroom_id[roomName]);
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

app.get("*", (req, res) => {
  res.redirect("/");
})

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
    if(body.pass == "on" && !body.password){
      res.redirect("/");
      return;
    }
    database.databaseInitialise();
    await database.createNewChatroom(roomName, body.pass == "on" ? true : false , body.password, body.save == "on" ? true : false);
    isPassEnter = body.pass == "on" ? true : false;
    let properties = await database.getProperties(roomName);
    chatroom_id[roomName] = properties[0];
    is_saved[roomName] = properties[1];
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
  // todo is_saved and preloaded messages are getting mixewd up between rooms
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
    
    checkConnectedUsers();
    
    socket.to(socket.roomName).emit("chat message", socket.username + " has entered the chat.");
    if(is_saved[roomName]){
      //console.log(preloadedMessages[roomName], roomName);
      socket.emit("load previous messages", preloadedMessages[roomName]);
      //preloadedMessages = null;
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
    
    io.in(socket.roomName).allSockets().then(function(value){
      let addToConnectedUsers = [];
      for (const name of value){
        if (io.of("/").sockets.get(name).username != undefined) {
          addToConnectedUsers.push(io.of("/").sockets.get(name).username);
        }
      }

      connectedUsers[socket.roomName] = addToConnectedUsers;
      
      io.to(socket.roomName).emit("whoIsOnline", connectedUsers[socket.roomName], socket.roomName);
    });
    return;
  }

  //when the user sends a chat message
  socket.on("chat message", (message) => {
    socket.broadcast.to(socket.roomName).emit("chat message", socket.username + ": " + message);
    if(is_saved[roomName]){
      database.insertMessage(chatroom_id[socket.roomName], socket.username, message, false, false);
    }
  });

  socket.on("send image", (user, image) => { // socket for sending an image, gets the name of the user sending it and the image in binary format

    
    if (Buffer.byteLength(image, 'utf8') > 1048576){
      socket.to(socket).emit("chat message", "The Image Size is too Large!");
    }
    else{
      socket.broadcast.to(socket.roomName).emit("receive image", user, image); // send the images to users in the room other than the sender

      if(is_saved[socket.roomName]){ // if the messages in the chatroom is saved, proceed to save the image in the disk and realted info in the database
        // separating header from the data (image)
        let imageSplit = image.split(',');
        let fileType = imageSplit[0].split('/')[1].split(';')[0];
        const buffer = Buffer.from(imageSplit[1], "base64"); // use this to encode the binary data into base64

        
        // Check and Generate Directory to store the image, directory is sent_images/{chatroom}
        const directory = path.join(__dirname , 'sent_images' , socket.roomName);

        fs.mkdir(directory, (e) => { // generate directory
            if(e){

            }
          });

        // Generate a random filename with a length of 10 characters here
        let fileName = spr.random(10);

        // check if file name exists, if it does, get a different one
        while (fs.existsSync(path.join(directory , fileName + '.' + fileType))) {
          fileName = spr.random(10);
        }

        // Save image into the disk
        fs.writeFileSync(path.join(directory , fileName + '.' + fileType), buffer);
        
        // store image name, image location, type chatroom_id, username into the database
        database.insertImage(fileName, directory, fileType, chatroom_id[socket.roomName], socket.username, null, false, true);
      }
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