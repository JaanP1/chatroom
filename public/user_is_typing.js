// User is typing
let typingTimeout = null;
let isUserTyping = false;

messageInput.onkeypress = function (e) {
  // let the server know the user has started typing
  if (e.keyCode == 13 || isPrivateMessageModeActive) {
    // don"t show the user is tytping for enter key and if the user is in private mode
    return;
  }

  clearTimeout(typingTimeout);

  if (!isUserTyping) {
    // check if the user is typing
    isUserTyping = true;
    socket.emit("typing", nickname);
  }

  typingTimeout = setTimeout(stoppedTypingTimeOut, 2000); // set a timeout in milliseconds, once it runs out let the server know the user has stopped typing
};

function stoppedTypingTimeOut() {
  // let the server know the user has stopped typing
  socket.emit("not typing", nickname);
  isUserTyping = false;
}

let usersTypingSet = new Set(); // a set that stores the users that are typing
socket.on("typing", function (name) {
  // add the users that are typing to the set here
  if (!usersTypingSet.has(name)) {
    usersTypingSet.add(name);
    userIsTypingMessage(usersTypingSet); // update the message after the set has been changed
  }
});

socket.on("not typing", function (name) {
  // remove the user from set, update the message
  if (usersTypingSet.has(name)) {
    usersTypingSet.delete(name);
    userIsTypingMessage(usersTypingSet);
  }
});

function userIsTypingMessage(userTyping) {
  if (userTyping.size == 0) {
    // hide the message
    document.getElementById("user-typing").style.visibility = "hidden";
  } else {
    let typing = "";
    userTyping.forEach(
      (key) =>
        (typing = typing == "" ? (typing += key) : (typing += ", " + key))
    ); // concatanate the set of users who are typing

    if (userTyping.size == 1) {
      document.getElementById("user-typing").innerHTML =
        "Following user is typing: " + typing;
    } else {
      document.getElementById("user-typing").innerHTML =
        "Following users are typing: " + typing;
    }

    document.getElementById("user-typing").style.visibility = "visible";
  }
}