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
/*document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
}*/

const BG_COLOR = '#231f20';
const SNAKE_COLOR = 'blue';
//const FOOD_COLOR = '#e66916';
var joueur = {id: null, pseudo: "", moto: ""};
var motos_available = [];

var client = io('http://192.168.56.1:3000', {transports: ['websocket', 'polling', 'flashsocket']});
/*client.on('init', handleInit);
client.on('gameState', handleGameState);
client.on('gameOver', handleGameOver);*/
client.on('welcome', function(socketId) {
  joueur.id = socketId;
});
client.on('motoAvailable', createMotoSelector);

var slideIndex;

function createMotoSelector(motos) {
  motos_available = motos
  let divSelector = document.querySelector('#motoSelector');
  let divDots = document.querySelector('#dots');
  if (motos.length > 0) {
    for (var i = 0; i < motos.length; i++) {
      dots.innerHTML += "<span class='dot' onclick='currentSlide("+(i+1)+")'></span>";

      if (motos[i] == "bleu") {
        divSelector.innerHTML += "<div class='mySlides fade'>"+
                                    "<img src='img/bleu.png' width='100%'>"+
                                 "</div>";
      }
      if (motos[i] == "vert") {
        divSelector.innerHTML += "<div class='mySlides fade'>"+
                                    "<img src='img/vert.png' width='100%'>"+
                                 "</div>";
      }
      if (motos[i] == "orange") {
        divSelector.innerHTML += "<div class='mySlides fade'>"+
                                    "<img src='img/orange.png' width='100%'>"+
                                 "</div>";
      }
      if (motos[i] == "rouge") {
        divSelector.innerHTML += "<div class='mySlides fade'>"+
                                    "<img src='img/rouge.png' width='100%'>"+
                                 "</div>";
      }
    }
    slideIndex = 1;
    showSlides(slideIndex);
  }
  else {
    divSelector.innerHTML = "<div style='text-align: center;'>"+
                              "<h2>Plus de moto disponible</h2>"+
                            "</div>";
    document.querySelector('#loginBTN').disabled = true;
  }

}

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
}


document.querySelector("#formLogin").addEventListener('submit', function(e) {
  event.preventDefault();
  joueur.pseudo = document.login.children.pseudo.value;
  joueur.moto = motos_available[slideIndex-1];
  console.log(document.login.children.pseudo.value);
  console.log(slideIndex-1);
  client.emit('login', joueur);
});

/*const gameScreen = document.getElementById("gameScreen");
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
  console.log(event.keyCode);
  //socket.emit('keydown', event.keyCode);
  var keyCode = parseInt(event);
  var newPos = {};
  switch(keyCode){
      case 37: { //left
          newPos = { x: -1, y: 0 };
      }
      case 38: {//down
          newPos = { x: 0, y: -1 };
      }
      case 39: {//right
          newPos = { x: 1, y: 0} ;
      }
      case 40: {//up
          newPos = { x: 0, y: 1} ;
      }
  }
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
}*/
