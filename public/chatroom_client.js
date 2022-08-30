let socket = io({autoConnect: false});

// Nickname
let nicknameWindow = document.getElementById("nickname"); // nickname window
let nickname = null; //nickname chosen by the user
let nickForm = document.getElementById("nick-form");
let nickInput = document.getElementById("nick-input");
let isNicknameChosen = false;

nickForm.onsubmit = function (e) {
  e.preventDefault();
  socket.connect();
  if (!nickInput.value) {
    nickname = "Anonymous";
  }
  socket.emit("nickname", nickInput.value);
  nickname = nickInput.value;

  closeNicknameWindow();
};

function closeNicknameWindow() {
  nicknameWindow.style.display = "none";
  messageInput.focus();
  isNicknameChosen = true;
  document.getElementById("private-message").style.display = "block";
}

// user is Online

let usersOnline;
socket.on("whoIsOnline", function (onlineUsers, room_name) {
  let whoIsOnlineMessage = "";
  usersOnline = onlineUsers;
  for (let i = 0; i < usersOnline.length; i++) {
    if (whoIsOnlineMessage == "") {
      whoIsOnlineMessage = "Users Online in " + room_name + ": " + usersOnline[i];
    } else {
      whoIsOnlineMessage += ", " + usersOnline[i];
    }
  }

  if (isNicknameChosen) {
    document.getElementById("online-user-list").innerHTML = whoIsOnlineMessage;
  }
});

// normal messages
let messageForm = document.getElementById("message-form");
let messageInput = document.getElementById("message-input");

// Send Message
messageForm.onsubmit = function (e) {
  e.preventDefault();
  if (messageInput.value) {
    if (isPrivateMessageModeActive) {
      //send private message to user if the user is in private message mode
      addUserMessage(
        "Private Message Sent To " +
          sendPrivateMessageTo +
          ": " +
          messageInput.value,
        true
      ); // make it appear on the client screen
      socket.emit("private message", sendPrivateMessageTo, messageInput.value); // send the message to the server
      cancelPrivateMessageMode();
    } else {
      // Normal Message
      addUserMessage(nickname + ": " + messageInput.value, false);
      socket.emit("chat message", messageInput.value);
    }

    messageInput.value = "";
  }
  return false;
};

// Receive Message
let newMessageAmount = 0;
let notificationSound = document.getElementById("notificationSound");

socket.on("chat message", function (msg) {
  if (isNicknameChosen) {
    if (!window.hidden){
      newMessageAmount += 1
      document.title = "New Message! (" + newMessageAmount + ")";
      notificationSound.play();
    }
    addUserMessage(msg, false);
  }
});

socket.on("receive image", (user, image) => {
  if (isNicknameChosen) {
    if (!window.hidden){
      newMessageAmount += 1
      document.title = "New Message! (" + newMessageAmount + ")";
      notificationSound.play();
    }
    addImages(user, image);
  }
});

window.onfocus = () => {
  document.title = "JaanChat";
  newMessageAmount = 0;
};

socket.on("private message", function (from, msg) {
  if (isNicknameChosen) {
    addUserMessage("Private Message From " + from + ": " + msg, true);
  }
});

socket.on("load previous messages", function(msg_block){
  if (!msg_block) return;

  for (let i = msg_block.length - 1; i >= 0; i--){
    if(msg_block[i][2]){
      addImages(msg_block[i][0], msg_block[i][3]);
    }
    else{
      addUserMessage(msg_block[i][0] + ": " + msg_block[i][1]);
    }
  }
});

function addUserMessage(msg, isPrivate=false) {
  let item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);
  if (isPrivate) {
    item.style.backgroundColor = "rgba(255, 75, 75, 0.75)";
  }
  window.scrollTo(0, document.body.scrollHeight);
}

function addImages(user, image){
  let item = document.createElement("li");
  item.textContent = user + " sent: ";
  let linebreak = document.createElement("br");
  item.appendChild(linebreak);
  item.appendChild(linebreak);
  let img = document.createElement("img");
  img.src = image;
  item.appendChild(img);
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
  
}

//Uploading Images
let uploadImageButton = document.getElementById("sendImage");
let imageSubmit = document.getElementById("imageSubmit");

// when Upload Image button is clicked, let the user select file to upload
uploadImageButton.onclick = () => {
  imageSubmit.click();
}

// when a file (images only) is submitted, check the file size
// if the file size is larger than half a MB, send alert to user
imageSubmit.onchange = (e) => {
  const image = imageSubmit.files[0];
  let maxSize = 524288; // half MB

  if(image.size > maxSize){
    alert("Image is too big!");
  }
  else{
    const fileReader = new FileReader();
    fileReader.readAsDataURL(image);
    fileReader.onload = () => {
      addImages(nickname, fileReader.result);
      socket.emit("send image", nickname, fileReader.result);
    }
  }
  messageInput.focus();
}

