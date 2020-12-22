/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
//document.addEventListener('deviceready', onDeviceReady, false);
//
//function onDeviceReady() {
//    // Cordova is now initialized. Have fun!
//
//    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
//    document.getElementById('deviceready').classList.add('ready');
//}

//function send() {
//  const ws = new WebSocket('ws://localhost:8080');
//
//  ws.onopen = function() {
//    ws.send("Hello");
//  }
//
//  ws.onmessage = function(msg) {
//    console.log(msg);
//  }
//}
/////////////////////////////////////////////////////////////

// import { connect, play } from './networking';
// import { startRendering, stopRendering } from './render';
// import { startCapturingInput, stopCapturingInput } from './input';
// import { downloadAssets } from './assets';
// import { initState } from './state';
// import { setLeaderboardHidden } from './leaderboard';

// import './css/main.css';

// const playMenu = document.getElementById('play-menu');
// const playButton = document.getElementById('play-button');
// const usernameInput = document.getElementById('username-input');

// Promise.all([
//   connect(),
//   downloadAssets(),
// ]).then(() => {
//   playMenu.classList.remove('hidden');
//   usernameInput.focus();
//   playButton.onclick = () => {
//     // Play!
//     play(usernameInput.value);
//     playMenu.classList.add('hidden');
//     initState();
//     startCapturingInput();
//     startRendering();
//     setLeaderboardHidden(false);
//   };
// });
//////////////////////////////////////////////////////////////////

const BG_COLOR = '#231f20';
const SNAKE_COLOR = 'blue';
//const FOOD_COLOR = '#e66916';

let isSimulator;

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    console.log("device: ");
    isSimulator = device.isVirtual;
    // console.log(device.isVirtual);
    console.log(isSimulator);
}

if(isSimulator){
  var socket = io('http://10.0.2.2:5584', {transports: ['websocket', 'polling', 'flashsocket']});
}else{
  var socket = io('http://localhost:3000', {transports: ['websocket', 'polling', 'flashsocket']});
}

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);

const gameScreen = document.getElementById("gameScreen");
let canvas, contex;

function init(){
  canvas = document.getElementById('canvas');
  contex = canvas.getContext('2d');

  canvas.width = canvas.height = 600;

  contex.fillStyle = BG_COLOR;
  contex.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener('keydown', keydown);
}

function keydown(event){
  // console.log(event.keyCode);
  socket.emit('keydown', event.keyCode);
}

init();

function paintGame(state){
  contex.fillStyle = BG_COLOR;
  contex.fillRect(0, 0, canvas.width, canvas.height);

  // const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

//  contex.fillStyle = FOOD_COLOR;
  // contex.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.player, size, SNAKE_COLOR);
}

function paintPlayer(playerState, size, color) {
  const snake = playerState.snake;
  contex.fillStyle = color;

  for(let cell of snake){
    contex.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

function handleInit(msg) {
  console.log(msg); 
}

function handleGameState(gameState) {
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver() {
  alert("You Lose!");
}