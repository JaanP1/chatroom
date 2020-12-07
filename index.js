var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);

app.get('/', function (req, res) {
    res.send("Hi There Bitch!");
})

server.listen(3000, function() {
    console.log('Listening on port 3000...');
});