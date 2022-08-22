<h1>Chatroom Application</h1>

A lightweight and easy to use chatroom application made for quick communications between people. No hassle, no account needed, simply create a room and share the link with friends. User has the options for saving messages and protecting the room with a password. It was built with HTML, CSS, Javascript and NodeJS using socket.io API. Go to jaanparekh.com to test the application, use multiple tabs to test features (the application treats each tab as a different user).


<h2> Features </h2>

<ul>
  <li> Nicknames </li>
  <li> Direct private messaging in public rooms </li>
  <li> "X is typing..." </li>
  <li> Show a list of online users </li>
  <li> Dynamically create new rooms </li>
  <li> Option for saving messages in a room </li>
  <li> Option to create password protected rooms </li>
  <li> Notifications </li>
</ul>

<h2>Upcoming Features </h2>

<ul>
  <li> Sending, receiving and saving images</li>
  <li> End-to-end encryption </li>
</ul>

<h2> How to use</h2>

Index Page:
![image](https://user-images.githubusercontent.com/42306776/186016893-503f3fa6-1279-49bc-80b1-8c8e0daf34df.png)

Here, users have three options. First option is to "Enter General Chat"; it is a general purpose chatroom that is not password protected, messages are not saved and private messaging is allowed. 
<br>
<br>
Second option is "Enter Existing Room", upon clicking it the user will get a field to enter an already existing chatroom.
<br>
<br>
Third option is "Create New Room", upon clicking it the user will have several options for the new room, they can make it password protected and/or save messages.
<br>
<br>
Note that chatroom names are unique. Users can also enter a chatroom directly by entering its name in the path after the domain name. If the user enters a path that does not exist, a room that is identical to the general room will be created.
<br><br>
Once a room is entered the user will be asked to input a nickname. Upon entry the user will see a list of online users in the top left corner and a private message button on the top right. See below:
![image](https://user-images.githubusercontent.com/42306776/185995609-958815ae-a9a6-4959-980d-3923d8948504.png)

Clicking the private message button will show a list of users that are currently online in the chat and clicking on one of the users in the list will activate the private messaging mode. Private messaging mode will make the messages appear in red and will let the sender and receiver know who sent it and who it was for.


<h2> Implementation of some key features </h2>

<h3> "User is typing" notifications </h3>

<h4>What does it do? </h4>
![image](https://user-images.githubusercontent.com/42306776/185996147-f5bf137b-1ac4-463a-8fc3-dc49e21d6d0d.png)
This feature shows every user that is currently typing a message in the room. Once they send or stop typing for a few seconds, their names dissappear. This alert is not displayed when the user is in private messaging mode.

<h4>Initial Implementation</h4>
The client sent the server a "user is typing" message with every keystroke. The server sent the name of the typer to all the other clients connected to the same room, where the typers name would be displayed. 

<h4>Problem with this Implementation</h4>
The main problem was sending an alert with each key stroke. It was unnecessary and it can reduce the performance of the application from all the alerts sent between the clients and the servers. Constantly sending and receiving alerts for each keystroke from every single user can reduce the battery life of device for the client as well.

<h4>Solution</h4>
A user is either in a state of "typing" or "not typing". If we keep track of these states, we can eliminate the need to send an alert with every keystroke, instead sending an alert only when the user changes state. The application keeps a track of the state on the client side, if the user is "not typing" and a keystroke is detected their state is now "typing". If the user is "typing" we start a timer of several seconds. Each keystroke resets the timer. Once the timer runs out they are now "not typing".

<h4>Next Steps</h4>
The solution can still be improved. Firstly, we can add server side validation to check the changes in the user state. A malicious user can modify the script on the client side to constantly send alerts. Secondly, we can represent users as objects, add a isTyping field and change this value with a method for better code organization. Currently, the "isTyping" state is tracked with a boolean variable.
<br><br>
<h3> Designing the database for saving messages and rooms</h3>

<h4>Design</h4>
This project uses a relational database, MySql. There are two tables, chatrooms and messages. The chatroom table records chatroom_id (key), chatroom_name (text), is_password_needed (boolean), password (encrypted with bcrypt) and is_saved (boolean). The message table records message_id(key), chatroom_id (the key of the chatroom the message was sent in), sent_by (text), message (text), is_private (boolean) and sent_to (text).

<h4>Next Steps</h4>
Add a new column for messages called is_image. Create a new table called images with the following columns: add message_id(key), file_name, directory, file_type and message_id (connect messages and images).
<br><br>

<h3> Entering and creating chatrooms </h3>

<h4> Design </h4>
The users can type in a room name after the domain and the application will direct them an existing room or it will create a new one with basic features.
In detail:

<ol>
  <li>Check if the room exists. If it does not create it.</li>
  <li>Get the chatroom_id.</li>
  <li>Check if the is_saved field for the chatroom is true.</li>
  <li>If is_saved is true, get the last X messages for that chatroom(the messages are connected to chatrooms with chatroom_id column).</li>
  <li>Check if password is required for the chatroom.</li>
  <li>If it is, redirect user to the login page, else send them to the chatroom.</li>
  <li>If the user enter the correct password, send them to the chatroom page.</li>
</ol>

<h4>Next Steps</h4>
Reduce database calls by:
<ol>
  <li>Check if the chatroom name is prohibited before any database calls.</li>
  <li>Get all chatroom properties in a single call from the database. </li>
  <li>Fetch the previous messages after the password is entered correctly to minimize database calls.</li>
</ol>
