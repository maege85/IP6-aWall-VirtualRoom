var express = require('express'),
	app = express(),
	server = require('http').createServer(app);

var deployPath = process.env.deployPath || "";
console.log('deploy path is set to ' + deployPath);

	app.use(deployPath , express.static(__dirname)); // client code goes in static directory

//

app.get('/login', function(req, res,next) {
    res.sendFile(__dirname + '/login.html');
});

app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

var membersPerRoom = new Object(); 
var clientInfos = [];
var connectedCount = 0;
var io = require('socket.io').listen(server, { path : '/vroom/socket.io' });
	io.sockets.on('connection', function (socket) {
		
        socket.on('create_join', function (data) {
			log(socket,'Connectedcount=' +connectedCount);
				log(socket,'room:' + data.room);
				log(socket,'Port '+ process.env.PORT); 
				addUserRoomIfNotFull(socket, data);
			
        });
		
        socket.on('message', function (message) {
            socket.broadcast.emit('message', message);
        });
		
		
		socket.on('login', function (user) {
			disconnectExistingUser(socket, user);
			clientInfos[user]= {id:socket.id}; 
			socket.emit('has-loged-in', membersPerRoom);
        });
		

        socket.on('disconnect', function (data) {
            connectedCount = 0;
			socket.leave(data);
			socket.emit('full', false);
			socket.broadcast.emit('message', "bye");
			socket.emit("message", "bye");			
        });
		
		  socket.on('hangup', function (data) {
            connectedCount = 0;
			socket.broadcast.emit('full', false);
			socket.broadcast.emit('message', "bye");
			membersPerRoom[data.room]= new Object();
        });
		
		socket.on('logout', function (user) {
			disconnectExistingUser(socket, user);
			 var index = clientInfos.indexOf(user);
			 if (index > -1) {
				clientInfos.splice(index, 1);
			}
        });

		
    });

server.listen(process.env.PORT, function () { console.log('Listening on ' + process.env.PORT) });
//////////////////////////////////////////////////////

function addUserRoomIfNotFull(socket, data){
	//First User has connected
				if (connectedCount == 0) {
					connectedCount += 1;
					socket.join(data.room);
					var members=[];
					members.push(data.user);
					clientInfos[data.user].isConnected = true;
					clientInfos[data.user].room = data.room;
					var roomInfos =  {roomName:data.room, members:members, isFull: false}; 
					membersPerRoom[data.room] = roomInfos;
					socket.emit('created', roomInfos);
					//Second User has connected
				} else if (connectedCount == 1) {
					connectedCount += 1;
					clientInfos[data.user].isConnected = true;
					membersPerRoom[data.room].members.push(data.user);
					membersPerRoom[data.room].isFull = true;
					io.sockets.in(data.room).emit('join', membersPerRoom[data.room]);
					socket.join(data.room);
					socket.emit('joined', membersPerRoom[data.room]);
				}
				else {
				log(socket,"room is full! Nr. of members: " + connectedCount);
				clientInfos[user].isConnected = false;
				socket.emit('full', membersPerRoom[data.room]);
				}
}

///////////////////////////////////////////////////////


function disconnectExistingUser(socket, user){
			for (var userInList in clientInfos) {
			  if (clientInfos.hasOwnProperty(userInList)) {
				  if(userInList==user){
					  if (typeof io.sockets.sockets[clientInfos[userInList].id] != 'undefined') {
				
							if(clientInfos[user].isConnected){
								log(socket, "User " + user + " has already been connected! disconnect existing user!");
								socket.broadcast.emit("log", "User " + user + " has loged in again. Disconnect session.");
								clientInfos[user].isConnected = false;
								socket.broadcast.emit('message', "bye");
								connectedCount = 0;
								io.sockets.sockets[clientInfos[userInList].id].disconnect();
								var roomUserWasConnected = clientInfos[user].room;
								membersPerRoom[roomUserWasConnected] = new Object();
							}
							
					  }
				  }
			  }
			}
	
	
}


////////////////////////////////////////////////////7
		// Logger
		function log(socket, message){
			socket.emit('log', ">>> Message from server: " + message);
		}
/////////////////////