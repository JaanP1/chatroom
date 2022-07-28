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
  for (let i = msg_block.length - 1; i >= 0; i--){
    addUserMessage(msg_block[i]['sent_by'] + ": " + msg_block[i]['message']);
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