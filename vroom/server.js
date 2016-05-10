var express = require('express'),
	app = express(),
	server = require('http').createServer(app);

var deployPath = process.env.deployPath || "";
console.log('deploy path is set to ' + deployPath);


app.use(deployPath + 'conference',function(req, res,next) {
		res.sendFile(__dirname + '/conference.html'); 
});

app.use(deployPath  + 'css' , express.static(__dirname + '/css')); // client code goes in static directory


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
			clientInfos[user]= {id:socket.id, inRoom:false}; 
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

server.listen(process.env.PORT, function () { console.log('Listening on ' + process.env.PORT)});
//////////////////////////////////////////////////////


function checkIfAllowedToConnect(user){
	if(clientInfos[user] == null || typeof clientInfos[user] == 'undefined') {
			console.log("User " + user + " is not logged in!");
		return false;
	}
	if(clientInfos[data.user].inRoom == true){
			console.log("User " + user + " is already connected!");
		return false;
	}
	return false;
}

//////////////////////////////////////////////////////
function addUserRoomIfNotFull(socket, data){
	//First User has connected
	
								
				if (connectedCount == 0) {
					connectedCount += 1;
					socket.join(data.room);
					var members=[];
					members.push(clientInfos[data.user]);
					clientInfos[data.user].inRoom = true;
					clientInfos[data.user].room = data.room;
					var roomInfos =  {roomName:data.room, members:members, isFull: false}; 
					membersPerRoom[data.room] = roomInfos;
					socket.emit('created', roomInfos);
					//Second User has connected
				} else if (connectedCount == 1) {
					connectedCount += 1;
					clientInfos[data.user].inRoom = true;
					membersPerRoom[data.room].members.push(clientInfos[data.user]);
					membersPerRoom[data.room].isFull = true;
					io.sockets.in(data.room).emit('join', membersPerRoom[data.room]);
					socket.join(data.room);
					socket.emit('joined', membersPerRoom[data.room]);
				}
				else {
				log(socket,"room is full! Nr. of members: " + connectedCount);
				clientInfos[user].inRoom = false;
				socket.emit('full', membersPerRoom[data.room]);
				}
}

///////////////////////////////////////////////////////


function disconnectExistingUser(socket, user){
			for (var userInList in clientInfos) {
			  if (clientInfos.hasOwnProperty(userInList)) {
				  if(userInList==user){
					 0
				
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
	
	



////////////////////////////////////////////////////7
		// Logger
		function log(socket, message){
			socket.emit('log', ">>> Message from server: " + message);
		}
/////////////////////