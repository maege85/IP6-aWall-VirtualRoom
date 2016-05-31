var express = require('express'),
	app = express(),
	server = require('http').createServer(app);

var deployPath = process.env.deployPath || "";
console.log('deploy path is set to ' + deployPath);


app.use(deployPath + 'conference',function(req, res,next) {
		res.sendFile(__dirname + '/conference.html'); 
});

app.use(deployPath  + 'css' , express.static(__dirname + '/css')); // client code goes in static directory

var connectedCount = 0;
var io = require('socket.io').listen(server, { path : '/vroom/socket.io' })

	io.sockets.on('connection', function (socket) {
		
        socket.on('create_join', function (data) {
			log(socket,'Connectedcount=' +connectedCount);
			log(socket,'room:' + data.room);
			addUserRoomIfNotFull(socket, data);		
        });
		
        socket.on('message', function (message) {
            socket.broadcast.emit('message', message);
        });
		

        socket.on('disconnect', function (data) {
            connectedCount = 0;
			socket.leave(data);
			socket.broadcast.emit('message', "bye");		
        });
	
		  socket.on('hangup', function (room) {
            connectedCount = 0;
			socket.broadcast.emit('message', "bye");
        });
	
		
    });

server.listen(process.env.PORT, function () { console.log('Listening on ' + process.env.PORT)});


//////////////////////////////////////////////////////
function addUserRoomIfNotFull(socket, data){
				if(connectedCount >= 2 ){
					log(socket,"room is full! Nr. of members: " + connectedCount + ". Kick everybody out of room!");
					socket.broadcast.emit("message", "bye");
					connectedCount = 0;
				}				
				if (connectedCount == 0) {
					connectedCount += 1;
					socket.join(data.room);
					socket.emit('created', data.room);
					//Second User has connected
				} else if (connectedCount == 1) {
					connectedCount += 1;
					io.sockets.in(data.room).emit('join', data.room);
					socket.join(data.room);
					socket.emit('joined', data.room);
				}
				else{
					log(socket,"Something is wrong. connectedCount=" + connectedCount);
				}
}


////////////////////////////////////////////////////7
		// Logger
		function log(socket, message){
			socket.emit('log', ">>> Message from server: " + message);
		}
/////////////////////