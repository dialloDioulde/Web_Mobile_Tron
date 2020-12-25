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
const CANVAS_SIZE = Math.min(innerWidth, innerHeight) - 20;
const COLORS = {bleu: "#1A237E", orange: "#FF9800", rouge: "#D50000", vert: "#2E7D32"}
const MOTO_SIZE = {w: 7, l: 23};

var client;
var joueur = {
  id: null,
  pseudo: "",
  moto: 0,
  color: "",
  pos: null,
  dir: "",
  path: [],
  status: "ready",
  score: 0,
  win: 0,
  lose: 0
};
var motos_available = [];

var slide_index;
var timerId;
var canvas_ctx;


/***************************************
*       CONNEXION avec le SERVEUR      *
***************************************/
window.onload = function() {
  if (localStorage.pseudo) {
    joueur.pseudo = localStorage.pseudo;
    document.login.children.pseudo.value = joueur.pseudo;
  }

  client = io('http://192.168.56.1:3000', {transports: ['websocket', 'polling', 'flashsocket']});

  client.on('welcome', function(socketId, listMoto) {
    joueur.id = socketId;
    createMotoSelector(listMoto);
  });
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
    slide_index = 1;
    showSlides(slide_index);
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
  showSlides(slide_index += n);
}
// - Permet l'affichage de la moto choisi
function currentSlide(n) {
  showSlides(slide_index = n);
}
// - Affiche la moto courante
function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slide_index = 1}
  if (n < 1) {slide_index = slides.length}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slide_index-1].style.display = "block";
  dots[slide_index-1].className += " active";
}

// - Validation du formulaire et lancement du jeu si succès
document.querySelector("#formLogin").addEventListener('submit', function(e) {
  console.log("login");
  event.preventDefault();
  joueur.pseudo = document.login.children.pseudo.value;
  console.log(document.login.children.pseudo.value);

  joueur.moto = motos_available[slide_index-1];
  console.log(motos_available[slide_index-1]);

  if (joueur.moto == "bleu") {
    joueur.color = COLORS.bleu;
  }
  else if (joueur.moto == "orange") {
    joueur.color = COLORS.orange;
  }
  else if (joueur.moto == "rouge") {
    joueur.color = COLORS.rouge;
  }
  else {
    joueur.color = COLORS.vert;
  }

  client.emit('login', joueur, function(res) {
    if (res == "pseudo-unavailable") {
      console.log("echec");
      alert("Ce pseudo est déjà utilisé !");
    }
    else {
      console.log("valide");
      localStorage.pseudo = joueur.pseudo;
      initGame(res);
    }
  });
});

/************************************
*           INITIALISATION          *
************************************/
// - Affiche l'air de jeu
function initGame(data) {
  console.log("initGame");
  document.querySelector('.overlay').style.display = "none";
  client.off('welcome');
  client.off('motoAvailable');
  createPlayground();
  client.on('newPlayer', addMoto);
  //addMoto(data);

  var boxDialog = document.createElement('dialog');
  boxDialog.id = 'info';
  var text = document.createTextNode("");
  boxDialog.setAttribute("open", "open");
  boxDialog.appendChild(text);
  document.querySelector('#game').appendChild(boxDialog);
  client.emit('ready', function(str) {
    if (str == "waitOther") {
      document.querySelector('#info').innerHTML = "En attente d'autres joueur";
    }
    if (str == "waitPlay") {
      document.querySelector('#info').innerHTML = "En attente de la fin de partie";
    }
  });

  client.on('init', launchGame);
}

// - Créer l'aire de jeu avec les bonnes dimensions
function createPlayground() {
  document.querySelector('#game').style.display = "block";

  var playground = document.querySelector('#playground');
  if(CANVAS_SIZE == innerHeight){
    playground.style.width = CANVAS_SIZE+"px";
    playground.style.height = CANVAS_SIZE+"px";
  }
  else {
    playground.style.width = CANVAS_SIZE+"px";
    playground.style.height = CANVAS_SIZE+"px";
  }
  playground.style.overflow = "hidden";

  var canvas = document.querySelector('#tronCanvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  canvas_ctx = canvas.getContext("2d");
  console.log(canvas_ctx);
}

function addMoto(data) {
  for (var i = 0; i < data.players.length; i++) {
    if (data.players[i].status != "waiting") {
      var pos = scalePos(data.players[i], data.moto_size, data.size);
      console.log(pos);
      canvas_ctx.fillStyle = data.players[i].color;
      if (data.players[i].dir == "bottom" || data.players[i].dir == "top") {
        canvas_ctx.fillRect(pos.x, pos.y, data.moto_size.w, data.moto_size.l);
      }
      if (data.players[i].dir == "left" || data.players[i].dir == "right") {
        canvas_ctx.fillRect(pos.x, pos.y, data.moto_size.l, data.moto_size.w);
      }
    }
  }
}

function scalePos(moto, size, scale) {
  var x, y;
  if (moto.dir == "bottom" || moto.dir == "top") {
    x = ((moto.pos.x / scale.width) * CANVAS_SIZE) - (size.w/2);
    y = ((moto.pos.y / scale.height) * CANVAS_SIZE);
  }
  if (moto.dir == "right" || moto.dir == "left") {
    x = ((moto.pos.x / scale.width) * CANVAS_SIZE);
    y = ((moto.pos.y / scale.height) * CANVAS_SIZE) - (size.w/2);
  }
  return new Position(x,y);
}

function displayPlayersList(joueurs) {

}

function addPlayersGame(joueurs) {

}
// - Lance le compte à rebours et démarre la partie
function launchGame(joueurs){
  displayPlayersList(joueurs);
  addPlayersGame(joueurs);
  var timer = document.querySelector('#info');
  timer.innerHTML = "5";
  //timerRun();
  timerId = setInterval(timerRun, 1000);
}

// - Éxecute le compte à rebours
function timerRun() {
  /*setTimeout(function(){
    var t = document.querySelector('#info').textContent;
    console.log(t);
    if (parseInt(t) > 0) {
      document.querySelector('#info').innerHTML = t-1;
      timerRun();
    }
    else {
      document.querySelector('#info').innerHTML = "GO !";
      setTimeout(play(), 1000);
      //console.log("launch game");
    }
  }, 1000);*/
  counter = parseInt(document.querySelector('#info').textContent);
  counter--;
  if (counter == 0) {
    clearInterval(timerId);
    document.querySelector('#info').innerHTML = "GO !";
    setTimeout(play, 1000);
  }
  else {
    document.querySelector('#info').innerHTML = counter;
  }
}

/*******************************
*              JEU             *
*******************************/

function play() {
  console.log("play");
  document.querySelector('#info').style.display = "none";
  //document.addEventListener('keydown', keydown);
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

// - Classe qui représente les positions des objets du jeu à l'écran
class Position {
  // - Constructeur
  constructor(x=0,y=0){
    if(this == window || this == undefined){              // si this est égale à l'objet global window ou si this est undefined
      return new Position(x,y);                           // - on retourne une nouvelle instance de Position avec x=0 et y=0
    }
    else {                                                // sinon
      this.x = x;                                         // - on initialise un attribut x avec la valeur du paramètre x
      this.y = y;                                         // - on initialise un attribut y avec la valeur du paramètre y
      return this;                                        // - on retourne la position crée avec ses attributs x,y
    }
  }

  // - Ajoute une position à this
  add(pos=Position()) {
    this.x = this.x + pos.x;                              // on ajoute la coordonnée x à l'attribut x de notre position
    this.y = this.y + pos.y;                              // on ajoute la coordonnée y à l'attribut y de notre position
    return this;                                          // on retourne la nouvelle position
  }
}
