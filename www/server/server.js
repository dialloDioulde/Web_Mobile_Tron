/*var net = require('net');
var server = net.createServer(function (socket){
        socket.on('data', function(data){
        socket.write('server reply: ' + data);
    });
});
server.listen(8888);*/

//////////////////////////////////////////

//const WebSocket = require('ws');
//const server = new WebSocket.Server({
//  port: 8080
//});
//
//let sockets = [];
//server.on('connection', function(socket) {
//  sockets.push(socket);
//
//  // When you receive a message, send that message to every socket.
//  socket.on('message', function(msg) {
//    sockets.forEach(s => s.send(msg + " is server !"));
//  });
//
//  // When a socket closes, or disconnects, remove it from the array.
//  socket.on('close', function() {
//    sockets = sockets.filter(s => s !== socket);
//
//  });
//});

//////////////////////////////////////////

// const express = require('express');
// const http = require('http');
// const WebSocket = require('ws');

// const port = 8080;
// const server = http.createServer(express);
// const wss = new WebSocket.Server({ server })

// wss.on('connection', function connection(ws) {
//   ws.on('message', function incoming(data) {
//     wss.clients.forEach(function each(client) {
//       if (client !== ws && client.readyState === WebSocket.OPEN) {
//         client.send(data);
//       }
//     })
//   })
// })

// server.listen(port, function() {
//   console.log(`Server is listening on ${port}!`)
// })

// console.log("Socket is running");

///////////////////////////////////////////////////////

const io = require('socket.io')();
const { createGameState, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');

io.on('connection', client => {
  // client.emit('init', { data: 'hello world hehe!' });
  const state = createGameState();

  client.on('keydown', handleKeydown);

  function handleKeydown(keyCode){
    try {
      keyCode = parseInt(keyCode);
    } catch(event) {
      console.error(event);
      return;
    }

    const velocity = getUpdatedVelocity(keyCode);

    if(velocity){
      state.player.velocity = velocity;
    }

  }
  startGameInterval(client, state);
});

function startGameInterval(client, state){
  const intervalId = setInterval(() => {
    const winner = gameLoop(state);
    // console.log('interval');
    if( !winner ){
      client.emit('gameState', JSON.stringify(state));
    }else{
      client.emit('gameOver');
      clearInterval(intervalId);
    }
  }, 1500 / FRAME_RATE); //number of miliseconds to wait from each frame
}

io.listen(3000);
console.log("the server is running...");

/////////////////////////////////////////////////////
