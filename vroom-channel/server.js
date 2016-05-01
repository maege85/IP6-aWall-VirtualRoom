var express = require('express'),
	app = express(),
	server = require('http').createServer(app);

var deployPath = process.env.deployPath || "";
console.log('deploy path is set to ' + deployPath);

	app.use(deployPath , express.static(__dirname)); // client code goes in static directory

//


app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

	var connectedCount = 0;
	var roomCount = 0;
    var io = require('socket.io').listen(server, { path : '/vroom/socket.io' });

    io.sockets.on('connection', function (socket) {
		connectedCount += 1; 
   
		// Logger
		function log(){
			var array = [">>> Message from server: "];
			for (var i = 0; i < arguments.length; i++) {
				array.push(arguments[i]);
			}
			socket.emit('log', array);
		}
		
		
        socket.on('create_join', function (room) {
						
			var clients = io.sockets.adapter.rooms[room]; 
			var numClients = io.sockets.adapter.rooms[room] !== undefined ? Object.keys(io.sockets.adapter.rooms[room]).length : 0;
            log('Client length=>' + numClients);
			log('Connectedcount length=>' +connectedCount);
			if(connectedCount%2 !== 0) {
				roomCount = Math.floor((connectedCount+1)/2);
			}
			else {
			roomCount = Math.floor(connectedCount/2);	
			}
			
			 
			log('Roomcount' + roomCount);
			log('Port '+ process.env.PORT);
            if (connectedCount%2 !== 0) {
                socket.join(roomCount);
                socket.emit('created', roomCount);
            } else if (connectedCount%2 === 0) {
                io.sockets.in(roomCount).emit('join', roomCount);
                socket.join(roomCount);
                socket.emit('joined', roomCount);
            } 
        });
        socket.on('message', function (message) {
            socket.broadcast.emit('message', message);
        });

        socket.on('disconnect', function (data) {
            connectedCount -= 1;
			socket.leave(room);
            console.log('client disconnected');
		
        });
    });

server.listen(process.env.PORT, function () { console.log('Listening on ' + process.env.PORT) });
