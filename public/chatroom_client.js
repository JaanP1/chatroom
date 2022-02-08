let socket = io();

// Nickname
let nicknameWindow = document.getElementById("nickname"); // nickname window
let nickname = null; //nickname chosen by the user
let nickForm = document.getElementById("nick-form");
let nickInput = document.getElementById("nick-input");
let isNicknameChosen = false;

nickForm.onsubmit = function (e) {
  e.preventDefault();
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
socket.on("whoIsOnline", function (onlineUsers) {
  let whoIsOnlineMessage = "";
  usersOnline = onlineUsers;
  for (let i = 0; i < usersOnline.length; i++) {
    if (whoIsOnlineMessage == "") {
      whoIsOnlineMessage = "Users Online: " + usersOnline[i];
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
socket.on("chat message", function (msg) {
  if (isNicknameChosen) {
    addUserMessage(msg, false);
  }
});

socket.on("private message", function (from, msg) {
  if (isNicknameChosen) {
    addUserMessage("Private Message From " + from + ": " + msg, true);
  }
});

function addUserMessage(msg, isPrivate) {
  let item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);
  if (isPrivate) {
    item.style.backgroundColor = "rgba(255, 75, 75, 0.75)";
  }
  window.scrollTo(0, document.body.scrollHeight);
}

