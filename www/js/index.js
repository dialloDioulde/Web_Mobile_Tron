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

/** Variables globales **/
const CANVAS_SIZE = Math.min(innerWidth, innerHeight);

var client;
var joueur = {id: null, pseudo: "", moto: "", score: 0, win: 0, lose: 0};
var motos_available = [];
var slideIndex;

/***************************************
*       CONNEXION avec le SERVEUR      *
***************************************/
window.onload = function() {
  if (localStorage.pseudo) {
    joueur.pseudo = localStorage.pseudo;
    document.login.children.pseudo.value = joueur.pseudo;
  }
  client = io('http://192.168.56.1:3000', {transports: ['websocket', 'polling', 'flashsocket']});

  client.on('welcome', function(socketId) {
    joueur.id = socketId;
  });

  client.on('motoAvailable', createMotoSelector);
  client.on('init', launchGame);
}

/*******************************
*             LOGIN            *
*******************************/

// - Ajoute dans le document HTML les éléments des motos disponibles
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

// - Permet la navigation entre les différentes motos disponibles
function plusSlides(n) {
  showSlides(slideIndex += n);
}
// - Permet l'affichage de la moto choisi
function currentSlide(n) {
  showSlides(slideIndex = n);
}
// - Affiche la moto courante
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

// - Validation du formulaire et lancement du jeu si succès
document.querySelector("#formLogin").addEventListener('submit', function(e) {
  event.preventDefault();
  joueur.pseudo = document.login.children.pseudo.value;
  joueur.moto = motos_available[slideIndex-1];
  console.log(document.login.children.pseudo.value);
  console.log(slideIndex-1);
  client.emit('login', joueur, function(res) {
    console.log(res);
    if (res == "pseudo-unavailable") {
      alert("Ce pseudo est déjà utilisé !");
    }
    else {
      localStorage.pseudo = joueur.pseudo;
      initGame();
    }
  });
});

/************************************
*           INITIALISATION          *
************************************/
// - Affiche l'air de jeu
function initGame() {
  document.querySelector('.overlay').style.display = "none";
  client.off('welcome');
  client.off('motoAvailable');
  createPlayground();

  var boxDialog = document.createElement('dialog');
  boxDialog.id = 'info';
  var text = document.createTextNode("");
  boxDialog.setAttribute("open", "open");
  boxDialog.appendChild(text);
  document.querySelector('#game').appendChild(boxDialog);
  client.emit('ready', function(res) {
    if (res == "waitOther") {
      document.querySelector('#info').innerHTML = "En attente d'autres joueur";
    }
    if (res == "waitPlay") {
      document.querySelector('#info').innerHTML = "En attente de la fin de partie";
    }
  });
}

// - Lance le compte à rebours et démarre la partie
function launchGame(){
  var timer = document.querySelector('#info');
  timer.innerHTML = "5";
  timerRun();
  setTimeout(play(), 1000);
  console.log("launch game");
}

// - Éxecute le compte à rebours
function timerRun() {
  setTimeout(function(){
    var t = document.querySelector('#info').textContent;
    console.log(t);
    if (parseInt(t) > 0) {
      document.querySelector('#info').innerHTML = t-1;
      timerRun();
    }
    else {
      document.querySelector('#info').innerHTML = "GO !";
      //setTimeout(launchGame(), 1000);
      //console.log("launch game");
    }
  }, 1000);
}

// - Créer l'aire de jeu avec les bonnes dimensions
function createPlayground() {
  document.querySelector('#game').style.display = "block";

  var playground = document.querySelector('#playground');
  if(CANVAS_SIZE == innerHeight){
    playground.style.width = (CANVAS_SIZE - 20)+"px";
    playground.style.height = (CANVAS_SIZE - 20)+"px";
  }
  else {
    playground.style.width = CANVAS_SIZE+"px";
    playground.style.height = CANVAS_SIZE+"px";
  }
  playground.style.overflow = "hidden";

  var canvas = document.querySelector('#tronCanvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  var ctx = canvas.getContext("2d");

}

/*******************************
*              JEU             *
*******************************/

function play() {
  document.querySelector('#info').style.display = "none";
  document.addEventListener('keydown', keydown);
}


function paintPlayer(playerState) {
  const snake = playerState.snake;
  contex.fillStyle = color;

  for(let cell of snake){
    contex.fillRect(cell.x * size, cell.y * size, size, size);
  }
}
function handleGameState(gameState) {
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver() {
  alert("You Lose!");
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
