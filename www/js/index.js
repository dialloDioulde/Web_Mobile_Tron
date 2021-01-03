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
const FRAME_RATE = 10;
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
let gameData = [];
let test = '';
let dataToDisplay = {};
let loopVerification = false;
let gameStart = null;
var motos_available = [];

var slide_index;
var timerId;
var gameLoopId;
var canvas_ctx;


/***************************************
 *       CONNEXION avec le SERVEUR      *
 ***************************************/
window.onload = function() {
  if (localStorage.pseudo) {
    joueur.pseudo = localStorage.pseudo;
    document.login.children.pseudo.value = joueur.pseudo;
  }

  client = io('http://10.185.212.23:3000', {transports: ['websocket', 'polling', 'flashsocket']});

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
  document.querySelector('.overlay').style.display = "none";
  client.off('welcome');
  client.off('motoAvailable');
  createPlayground();
  client.on('newPlayer', drawMoto);
  //drawMoto(data);

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
  client.on('finish', finish);
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


function drawMoto(data) {
  for (var i = 0; i < data.players.length; i++) {
    if (data.players[i].status != "waiting") {
      var pos = scalePos(data.players[i], data.moto_size, data.size);
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

function scalePos(player, size, scale) {
  var x, y;
  if (player.dir == "bottom" || player.dir == "top") {
    x = parseFloat((((player.pos.x / scale.width) * CANVAS_SIZE) - (size.w/2)).toFixed(2));
    y = parseFloat(((player.pos.y / scale.height) * CANVAS_SIZE).toFixed(2));
  }
  if (player.dir == "right" || player.dir == "left") {
    x = parseFloat(((player.pos.x / scale.width) * CANVAS_SIZE).toFixed(2));
    y = parseFloat((((player.pos.y / scale.height) * CANVAS_SIZE) - (size.w/2)).toFixed(2));
  }
  return {x: x, y: y};
}

function scalePath(path, scale) {
  var normalizePath = [];
  for (var i = 0; i < path.length; i++) {
    var x = parseFloat(((path[i].x / scale.width) * CANVAS_SIZE).toFixed(2));
    var y = parseFloat(((path[i].y / scale.height) * CANVAS_SIZE).toFixed(2));
    normalizePath.push({x: x, y: y});
  }
  return normalizePath;
}

function displayPlayersList(joueurs) {

}

function addPlayersGame(joueurs) {

}
// - Lance le compte à rebours et démarre la partie
function launchGame(gameState){
  //displayPlayersList(joueurs);
  //addPlayersGame(joueurs);
  for (var i = 0; i < gameState.players.length; i++) {
    if (gameState.players[i].id == joueur.id) {
      console.log(gameState.players[i].pos);
      joueur.pos = scalePos(gameState.players[i], gameState.moto_size, gameState.size);
    }
  }
  console.log(joueur.pos);

  var timer = document.querySelector('#info');
  timer.innerHTML = "5";
  timerId = setInterval(timerRun, 1000);
}

// - Éxecute le compte à rebours
function timerRun() {
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
  document.addEventListener('keydown', keydown);

  gameLoopId = setInterval(() => {
    if (joueur.status != 'waiting' && joueur.status != 'dead') {
      switch (joueur.dir) {
        case "top":
          joueur.pos.y -= 24;
          break;
        case "bottom":
          joueur.pos.y += 24;
          break;
        case "left":
          joueur.pos.x -= 24;
          break;
        case "right":
          joueur.pos.x += 24;
          break;
      }
      client.emit('updatePos', joueur, CANVAS_SIZE);
      gameStart = new Date().getTime() / 1000;
    }
  }, 1500 / FRAME_RATE);

  client.on('update', update);
  client.on('newDir', update);

  //************** Début : Écoute des Evenements (Statistique du Jeu) ************************************************//

  //************** Fin : Écoute des Evenements (Statistique du Jeu) **************************************************//
}


function update(gameState) {
  canvas_ctx.clearRect(0,0, CANVAS_SIZE, CANVAS_SIZE);
  drawMoto(gameState);
  var players = gameState.players;
  for (var i = 0; i < players.length; i++) {
    if (players[i].status != 'waiting') {
      canvas_ctx.beginPath();
      if (players[i].path.length > 1) {
        var normalizePath = scalePath(players[i].path, gameState.size);
        canvas_ctx.strokeStyle = players[i].color;
        canvas_ctx.moveTo(normalizePath[0].x, normalizePath[0].y);
        for (var j = 1; j < normalizePath.length; j++) {
          canvas_ctx.lineTo(normalizePath[j].x, normalizePath[j].y);
        }
        canvas_ctx.lineWidth = 2;
        canvas_ctx.stroke();
      }
    }

    if (players[i].id == joueur.id) {
      joueur.path = normalizePath;
      joueur.dir = players[i].dir;
    }
  }

  checkCollision(gameState);
  client.on('collide', playerDead);
}


function playerDead(gameState) {
  if (gameState.nbPlayers_alive <= 1) {
    clearInterval(gameLoopId);
    //********************** Début : Affichage Des Résultats Du JEU (GAGNANT) ****************************************//
    for (var i = 0; i < gameState.players.length; i++) {
      if (gameState.players[i].status !== "dead") {
        let gameEndWinner = new Date().getTime() / 1000;
        joueur.score = ((gameEndWinner - gameStart) * 50 + 100).toFixed(2);
        joueur.win = "Winner";
        joueur.lose = "No";
        joueur.status = "winner";
        console.log(joueur.score + " " + joueur.pseudo + " " + joueur.status + " " + joueur.win + " " + joueur.moto + " The Winner ! ");

        document.querySelector('#info').innerHTML = "YOU WIN";
        document.querySelector('#info').style.display = 'block';
        document.getElementById("info").style.backgroundColor = 'white';


        var newDiv0 = document.createElement("div");
        newDiv0.id = 'resData_0';
        var newDiv = document.createElement("div");
        newDiv.id = 'resData';
        var newDiv1 = document.createElement("div");
        newDiv1.id = 'resData_1';
        var newDiv2 = document.createElement("div");
        newDiv2.id = 'resData_2';
        var newDiv3 = document.createElement("div");
        newDiv3.id = 'resData_3';


        document.querySelector('#info').appendChild(newDiv0);
        document.querySelector('#info').appendChild(newDiv);
        document.querySelector('#info').appendChild(newDiv1);
        document.querySelector('#info').appendChild(newDiv2);
        document.querySelector('#info').appendChild(newDiv3);


        var newContent_0 = document.createTextNode( " Pseudo : " +  "  "  + joueur.pseudo);
        var newContent = document.createTextNode( " Score : " +  "  "  + joueur.score);
        var newContent_1 = document.createTextNode( " Status : " +  "  "  + joueur.status);
        var newContent_2 = document.createTextNode( " Moto : " +  "  "  + joueur.moto);
        var newContent_3 = document.createTextNode( " You are the new Great King of the STATE ! ");


        newDiv0.appendChild(newContent_0);
        newDiv.appendChild(newContent);
        newDiv1.appendChild(newContent_1);
        newDiv2.appendChild(newContent_2);
        newDiv3.appendChild(newContent_3);


        document.querySelector('#resData_0').style.display = 'block';
        document.querySelector('#resData').style.display = 'block';
        document.querySelector('#resData_1').style.display = 'block';
        document.querySelector('#resData_2').style.display = 'block';
        document.querySelector('#resData_3').style.display = 'block';
        document.getElementById("resData_0").style.backgroundColor = 'white';
        document.getElementById("resData").style.backgroundColor = 'white';
        document.getElementById("resData_1").style.backgroundColor = 'white';
        document.getElementById("resData_2").style.backgroundColor = 'white';
        document.getElementById("resData_3").style.backgroundColor = 'white';

        client.emit('winnerData', joueur);
      }
    }
    //********************** Fin : Affichage Des Résultats Du JEU (GAGNANT) ******************************************//

  }

  for (var i = 0; i < gameState.players.length; i++) {
    if (gameState.players[i].id === joueur.id) {
      if (gameState.players[i].status === "dead") {
        //********************** Début : Affichage Des Résultats Du JEU (PERDANT) ************************************//
        joueur.status = "dead";
        let gameEnd = new Date().getTime() / 1000;
        joueur.score = ((gameEnd - gameStart) * 50 + 50).toFixed(2);
        joueur.win = "No";
        joueur.lose = "Looser";
        console.log(joueur.score + " " + joueur.pseudo + " " + joueur.status + " " + joueur.lose + " " + joueur.moto + " The Looser ! ");

        document.querySelector('#info').innerHTML = "GAME OVER";
        document.querySelector('#info').style.display = 'block';
        document.getElementById("info").style.backgroundColor = 'white';

        var newDiv0 = document.createElement("div");
        newDiv0.id = 'resData_0';
        var newDiv = document.createElement("div");
        newDiv.id = 'resData';
        var newDiv1 = document.createElement("div");
        newDiv1.id = 'resData_1';
        var newDiv2 = document.createElement("div");
        newDiv2.id = 'resData_2';
        var newDiv3 = document.createElement("div");
        newDiv3.id = 'resData_3';

        document.querySelector('#info').appendChild(newDiv0);
        document.querySelector('#info').appendChild(newDiv);
        document.querySelector('#info').appendChild(newDiv1);
        document.querySelector('#info').appendChild(newDiv2);
        document.querySelector('#info').appendChild(newDiv3);

        var newContent_0 = document.createTextNode( " Pseudo : " +  "  "  + joueur.pseudo);
        var newContent = document.createTextNode( " Score : " +  "  "  + joueur.score);
        var newContent_1 = document.createTextNode( " Status : " +  "  "  + joueur.status);
        var newContent_2 = document.createTextNode( " Moto : " +  "  "  + joueur.moto);
        var newContent_3 = document.createTextNode( " You won't have the crepes this Night ! Oups ! ");


        newDiv0.appendChild(newContent_0);
        newDiv.appendChild(newContent);
        newDiv1.appendChild(newContent_1);
        newDiv2.appendChild(newContent_2);
        newDiv3.appendChild(newContent_3);

        document.querySelector('#resData_0').style.display = 'block';
        document.querySelector('#resData').style.display = 'block';
        document.querySelector('#resData_1').style.display = 'block';
        document.querySelector('#resData_2').style.display = 'block';
        document.querySelector('#resData_3').style.display = 'block';
        document.getElementById("resData_0").style.backgroundColor = 'white';
        document.getElementById("resData").style.backgroundColor = 'white';
        document.getElementById("resData_1").style.backgroundColor = 'white';
        document.getElementById("resData_2").style.backgroundColor = 'white';
        document.getElementById("resData_3").style.backgroundColor = 'white';

        client.emit('looserData', joueur);

        //********************** Fin : Affichage Des Résultats Du JEU (PERDANT) **************************************//

      }
    }
  }
}

function checkCollision(gameState) {
  //var myPos = scalePos(joueur, gameState.moto_size, gameState.size);
  var myPos = joueur.pos;
  if (joueur.dir == "bottom") {
    myPos = {x: myPos.x, y: myPos.y+gameState.moto_size.l};
  }
  if (joueur.dir == "right") {
    myPos = {x: myPos.x+gameState.moto_size.l, y: myPos.y};
  }
  console.log(myPos);
  for (var i = 0; i < gameState.players.length; i++) {
    if (gameState.players[i].id != joueur.id) {
      var normalizePath = scalePath(gameState.players[i].path, gameState.size);

      for (var j = 0; j < normalizePath.length; j++) {
        if (   Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x) && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)
            || Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x) && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)+1
            || Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x) && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)-1
            || Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x)+1 && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)
            || Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x)-1 && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)
            || Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x)+1 && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)+1
            || Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x)-1 && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)-1
            || Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x)+1 && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)-1
            || Math.trunc(myPos.x) == Math.trunc(normalizePath[j].x)-1 && Math.trunc(myPos.y) == Math.trunc(normalizePath[j].y)+1) {
          client.emit('collision', joueur.id);
          console.log("COLLIDE !!!");
        }
      }
    }
  }

  if (myPos.x >= CANVAS_SIZE || myPos.x <= 0 || myPos.y >= CANVAS_SIZE || myPos.y <= 0) {
    client.emit('collision', joueur.id);
    console.log("COLLIDE !!!");
  }

  for (var i = 0; i < joueur.path.length-1; i++) {
    if (Math.trunc(myPos.x) == Math.trunc(joueur.path[i].x) &&
        Math.trunc(myPos.y) == Math.trunc(joueur.path[i].y)) {
      client.emit('collision', joueur.id);
    }
  }
}

function keydown(event){
  switch(event.keyCode){
    case 37:
      //joueur.pos.x -= 24;
      client.emit('changeDir', joueur.id, 'left');
      break;

    case 38:
      //joueur.pos.y -= 24;
      client.emit('changeDir', joueur.id, 'top');
      break;

    case 39:
      //joueur.pos.x += 24;
      client.emit('changeDir', joueur.id, 'right');
      break;

    case 40:
      //joueur.pos.y += 24;
      client.emit('changeDir', joueur.id, 'bottom');
      break;

    case 80:
      clearInterval(gameLoopId);
      break;
  }
}

function handleMove(event) {
  console.log(event.touches);
  var touches = event.touches;
  console.log(touches[0].clientX);
  console.log(touches[0].clientY);
}

function finish(gameState) {

}





