// private messaging
let isPrivateUserListVisible = false;
let isPrivateMessageModeActive = false;
let sendPrivateMessageTo;
let privateMessageUserList = document.getElementById(
  "private-message-user-list"
);
let privateMessageUserButtons = document.getElementsByClassName(
  "private-message-user-buttons"
);
let privateMessageSendingToMessage = document.getElementById(
  "private-message-sending-to"
);

// when the Private Message at the top right corner of the screen is clicked
document.getElementById("private-message-button").onclick = function () {
  if (usersOnline.length <= 1 && !isPrivateUserListVisible) {
    return;
  }

  privateMessageUserList.style.display = isPrivateUserListVisible
    ? "none"
    : "block"; // toggle the list
  isPrivateUserListVisible = !isPrivateUserListVisible;

  // Remove all the users from the list
  while (privateMessageUserButtons.length > 0) {
    privateMessageUserButtons[0].remove();
  }

  // Add users back to the list, create a button for each online user
  for (let i = 0; i < usersOnline.length; i++) {
    if (usersOnline[i] != nickname) {
      var privateButton = document.createElement("button");
      privateButton.innerText = usersOnline[i];
      privateButton.className = "private-message-user-buttons";
      privateMessageUserList.appendChild(privateButton);
    }
  }

  // Check any click on the private message button and activate private message mode
  for (let i = 0; i < privateMessageUserButtons.length; i++) {
    privateMessageUserButtons[i].onclick = function () {
      privateMessageSendingToMessage.style.display = "inline";
      privateMessageSendingToMessage.innerText =
        "Sending private message to " +
        privateMessageUserButtons[i].innerText +
        ":";
      sendPrivateMessageTo = privateMessageUserButtons[i].innerText;
      messageForm.style.backgroundColor = "rgba(255, 75, 75, 0.75)";
      messageInput.style.backgroundColor = "rgba(255, 225, 225, 0.75)";
      messageInput.focus();
      privateMessageUserList.style.display = isPrivateUserListVisible
        ? "none"
        : "block";
      isPrivateUserListVisible = !isPrivateUserListVisible;
      isPrivateMessageModeActive = true;
    };
  }
};

// cancel button, gets rid of any input and takes user out of private messsage mode
document.getElementById("cancel").onclick = cancelPrivateMessageMode();

function cancelPrivateMessageMode() {
  if (isPrivateMessageModeActive) {
    privateMessageSendingToMessage.style.display = "none";
    messageForm.style.backgroundColor = "rgba(0, 0, 0, 0.15)";
    messageInput.style.backgroundColor = "white";
    isPrivateMessageModeActive = false;
  }
}