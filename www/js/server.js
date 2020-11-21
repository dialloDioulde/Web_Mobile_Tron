/*var net = require('net');
var server = net.createServer(function (socket){
        socket.on('data', function(data){
        socket.write('server reply: ' + data);
    });
});
server.listen(8888);*/

const WebSocket = require("ws");
const server = new WebSocket.Server({
  port: 8080,
});

let sockets = [];
server.on("connection", function (socket) {
  sockets.push(socket);

  // When you receive a message, send that message to every socket.
  socket.on("message", function (msg) {
    sockets.forEach((s) => s.send(msg + " is server !"));
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on("close", function () {
    sockets = sockets.filter((s) => s !== socket);
  });
});
