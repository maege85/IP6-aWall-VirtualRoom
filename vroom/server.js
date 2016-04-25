var express = require('express'),
	app = express(),    
	server = require('http').createServer(app),  
    io = require('socket.io').listen(server, { path : '/vroom/socket.io' });
var deployPath = process.env.deployPath || "";
console.log('deploy path is set to ' + deployPath);

app.use(deployPath , express.static(__dirname + '/client')); // client code goes in static directory
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/client/index.html');
});


io.on('connection', function (currentSocket) {
    currentSocket.on('message', function (message) {
               console.log('received: %s', message);
        currentSocket.broadcast.emit("message",message);
    });
});
//server.on('request', app);
server.listen(process.env.PORT, function () { console.log('Listening on ' + process.env.PORT) });
