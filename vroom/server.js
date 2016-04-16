var server = require('http').createServer(), 
    express = require('express'),    
    app = express(),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: server});
var deployPath = process.env.deployPath || "";
console.log('deploy path is set to ' + deployPath);

app.use(deployPath , express.static(__dirname + '/client')); // client code goes in static directory

wss.broadcast = function(data) {
    for(var i in this.clients) {
        this.clients[i].send(data);
    }
};

wss.on('connection', function (ws) {
    ws.on('message', function (message) {
               console.log('received: %s', message);
        wss.broadcast(message);
    });
});
server.on('request', app);
server.listen(process.env.PORT, function () { console.log('Listening on ' + process.env.PORT) });
