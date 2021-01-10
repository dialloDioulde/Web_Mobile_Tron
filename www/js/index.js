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


/** Variables globales **/
const FRAME_RATE = 500; // 0.5 sec
const CANVAS_SIZE = Math.min(innerWidth, innerHeight) - 20;
const COLORS = {bleu: "#1A237E", orange: "#FF9800", rouge: "#D50000", vert: "#2E7D32"};

/** Variables de jeu **/
var client;         // variable qui représente la connexion avec le serveur
var joueur = {      // données du joueur :
  id: null,         // - identifiant auprès du serveur (id socket)
  pseudo: "",       // - pseudo du joueur
  moto: 0,          // - numéro de la moto
  color: "",        // - couleur de la moto
  pos: null,        // - position de la moto dans le canvas (x,y) en pixel
  dir: "",          // - direction courante de la moto (top, left, bottom ou right)
  path: [],         // - tableau des 100 dernières positions de la moto
  status: "ready",  // - statut du joueur (ready, waiting, dead, ou winner)
  score: 0,         // - score du joueur
  win: 0,           // - nombre de victoire
  lose: 0           // - nombre de défaite
};
var gameId;                     // identifiant de la partie
var motos_available = [];       // tableau des motos disponibles
var motos_size = {w: 0, l: 0};  // taille de la moto
var slide_index;                // entier qui permet la sélection de la moto
var timerId;                    // identifiant pour le timer
var gameLoopId;                 // identifiant de la boucle de jeu
var canvas_ctx;                 // contexte du canvas


/***************************************
*       CONNEXION avec le SERVEUR      *
***************************************/
window.onload = function() {
  if (localStorage.pseudo) {
    joueur.pseudo = localStorage.pseudo;
    document.login.children.pseudo.value = joueur.pseudo;
  }
  document.querySelector('#btnNew').addEventListener("click", createGame);
  document.querySelector('#btnEnter').addEventListener("click", displayGames);

  // Wait for the deviceready event before using any of Cordova's device APIs.
  // See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
  document.addEventListener("deviceready", onDeviceReady, false);

}

// - Lance la connexion au serveur lorsque que le client est prêt
function onDeviceReady() {
  console.log(device.platform);

  //***************** mobile ********************//
  if (device.isVirtual || device.platform != "browser") {
    console.log("emulateur");
    client = io.connect('http://10.0.2.2:3030/');

    document.getElementById('north').addEventListener('click', function(e) {
      client.emit('changeDir', joueur.id, 'top');
    });
    document.getElementById('south').addEventListener('click', function(e) {
      client.emit('changeDir', joueur.id, 'bottom');
    });
    document.getElementById('west').addEventListener('click', function(e) {
      client.emit('changeDir', joueur.id, 'left');
    });
    document.getElementById('east').addEventListener('click', function(e) {
      client.emit('changeDir', joueur.id, 'right');
    });
  }
  //***************** ordinateur ********************//
  else {
    client = io('http://192.168.56.1:3000', {transports: ['websocket', 'polling', 'flashsocket']});
    document.getElementById("fleches").style.display = "none";
  }

  // - reçoit son identifiant de socket dès sa connexion avec le serveur
  client.on('welcome', function(socketId, rooms) {
    joueur.id = socketId;
    if (rooms.length > 0) {
      createGameSelector(rooms);
      document.querySelector('#btnEnter').style.display = "inline-block";
    }
  });
}

// - affiche la div html de la création d'une partie
function createGame() {
  document.querySelector('#welcomeDiv').style.display = "none";
  document.querySelector('#createGameDiv').style.display = "block";
}

// - affiche la div html de sélection d'une partie
function displayGames() {
  document.querySelector('#welcomeDiv').style.display = "none";
  document.querySelector('#selectGameDiv').style.display = "block";
}

// - créer la div html de sélection d'une partie
function createGameSelector(rooms) {
  let table = document.querySelector('.game_table');

  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].motos_available.length > 0) {
      table.innerHTML += "<tr> <td>"+(i+1)+"</td> <td class='roomName' onclick='selectRoom()'>"+rooms[i].name+"</td> <td>"+rooms[i].motos_available.length+"</td> </tr>";
    }
  }
}

// - permet de rejoindre la partie sélectionner
function selectRoom() {
  gameId = event.target.previousElementSibling.textContent-1;
  client.emit('selectRoom', gameId, function(room) {
    if (room) {
      console.log(room);
      createMotoSelector(room.motos_available);
      document.querySelector('#selectGameDiv').style.display = "none";
      document.querySelector('#loginDiv').style.display = "block";
    }
    else {
      alert("ERREUR: Cette partie n'existe plus !");
    }
  });
}

// - permet la création d'une partie
document.querySelector('#formGame').addEventListener('submit', function(e) {
  event.preventDefault();
  let nameGame = document.createGame.children.name.value;
  console.log(nameGame);

  let nbJoueurs = document.createGame.children.selectDiv.children.nbJoueurs.value;
  console.log(nbJoueurs);

  client.emit('createGame', nameGame, nbJoueurs, function(msg, game, game_ID) {
    if (msg == "name-unavailable") {
      console.log("echec");
      alert("Une partie de même nom est déjà en cours !");
    }
    else {
      console.log("valide");
      console.log(game);
      gameId = game_ID;
      createMotoSelector(game.motos_available);
      document.querySelector('#createGameDiv').style.display = "none";
      document.querySelector('#loginDiv').style.display = "block";
    }
  });
});

/*******************************
*             LOGIN            *
*******************************/
// - Créer la div html de sélection des motos
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

  client.emit('login', joueur, gameId, function(res) {
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

  // initialise les variables du joueur (position, direction, path)
  motos_size = scaleMotoSize(data.moto_size, data.size);
  for (var i = 0; i < data.players.length; i++) {
    if (data.players[i].id == joueur.id) {
      joueur = Object.assign({}, data.players[i]);
      joueur.pos = scalePos(joueur, data.size);
      joueur.path = scalePath(joueur.path, data.size);
    }
  }

  createPlayground();
  client.on('newPlayer', drawMoto);

  var boxDialog = document.createElement('dialog');
  boxDialog.id = 'info';
  var text = document.createTextNode("");
  boxDialog.setAttribute("open", "open");
  boxDialog.appendChild(text);
  document.querySelector('#game').appendChild(boxDialog);
  // - envoie au serveur que l'on est prêt à jouer
  client.emit('ready', gameId, function(str) {
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
}

// - Dessine les motos dans le canvas
function drawMoto(data) {
  for (var i = 0; i < data.players.length; i++) {
    if (data.players[i].status != "waiting") {
      let pos = scalePos(data.players[i], data.size);
      canvas_ctx.fillStyle = data.players[i].color;
      if (data.players[i].dir == "bottom" || data.players[i].dir == "top") {
        canvas_ctx.fillRect(pos.x-(motos_size.w/2), pos.y-(motos_size.l/2), motos_size.w, motos_size.l);
      }
      if (data.players[i].dir == "left" || data.players[i].dir == "right") {
        canvas_ctx.fillRect(pos.x-(motos_size.l/2), pos.y-(motos_size.w/2), motos_size.l, motos_size.w);
      }
    }
  }
}

// - Adapte la taille de la moto avec la taille du canvas
function scaleMotoSize(motoSize, scale) {
  let w = parseFloat(((motoSize.w / scale.width) * CANVAS_SIZE).toFixed(2));
  let l = parseFloat(((motoSize.l / scale.height) * CANVAS_SIZE).toFixed(2));
  return {w: w, l: l};
}

// - Repositionne la moto en fcontion de la taille du canvas
function scalePos(player, scale) {
  var x, y;
  x = parseFloat(((player.pos.x / scale.width) * CANVAS_SIZE).toFixed(2));
  y = parseFloat(((player.pos.y / scale.height) * CANVAS_SIZE).toFixed(2));

  return {x: x, y: y};
}

// - Repositionne les positions de la trace de la moto en fonction de la taille du canvas
function scalePath(path, scale) {
  var normalizePath = [];
  for (var i = 0; i < path.length; i++) {
    var x = parseFloat(((path[i].x / scale.width) * CANVAS_SIZE).toFixed(2));
    var y = parseFloat(((path[i].y / scale.height) * CANVAS_SIZE).toFixed(2));
    normalizePath.push({x: x, y: y});
  }
  return normalizePath;
}

// - Lance le compte à rebours et démarre la partie
function launchGame(gameState){
  client.off('init');
  var timer = document.querySelector('#info');
  timer.innerHTML = "5";
  timerId = setInterval(() => {
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
  }, 1000);
}

/*******************************
*              JEU             *
*******************************/
// - Boule de jeu
function play() {
  console.log("play");
  document.querySelector('#info').style.display = "none";
  document.addEventListener('keydown', keydown);

  gameLoopId = setInterval(() => {
    if (joueur.status != 'waiting' && joueur.status != 'dead') {
      switch (joueur.dir) {
        case "top":
          joueur.pos.y -= motos_size.l;
          break;
        case "bottom":
          joueur.pos.y += motos_size.l;
          break;
        case "left":
          joueur.pos.x -= motos_size.l;
          break;
        case "right":
          joueur.pos.x += motos_size.l;
          break;
      }
      joueur.score += 10;
      client.emit('updatePos', joueur, gameId, CANVAS_SIZE);
    }
  }, FRAME_RATE);

  client.on('update', update);
  client.on('collide', playerDead);
}

// - Met à jour le canvas
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
}

// - Focntion appelée à chaque fois qu'un joueur meurt (collision)
function playerDead(gameState, id) {
  console.log(id);
  if (id == joueur.id) {
    document.querySelector('#info').innerHTML = "PERDU !";
    document.querySelector('#info').style.display = 'block';
    client.off('update');
    client.off('collide');
    document.removeEventListener('keydown', keydown);

    joueur.status = "dead";
    joueur.score -= 20;
    joueur.lose += 1;
    client.emit('looserData', joueur, gameId);
  }

  if (gameState.nbPlayers_alive = 1) {
    console.log(gameState);
    finish();
  }
}

// - Gère l'appuie sur les flèches directionnelles du clavier
function keydown(event){
  switch(event.keyCode){
    case 37:
      if (joueur.dir == "top") {
        joueur.pos.y -= (motos_size.l/2);
      }
      if (joueur.dir == "bottom") {
        joueur.pos.y += (motos_size.l/2);
      }
      joueur.pos.x -= (motos_size.l/2);
      client.emit('changeDir', joueur, gameId, 'left', CANVAS_SIZE);
      break;

    case 38:
      if (joueur.dir == "left") {
        joueur.pos.x -= (motos_size.l/2);
      }
      if (joueur.dir == "right") {
        joueur.pos.x += (motos_size.l/2);
      }
      joueur.pos.y -= (motos_size.l/2);
      client.emit('changeDir', joueur, gameId, 'top', CANVAS_SIZE);
      break;

    case 39:
      if (joueur.dir == "top") {
        joueur.pos.y -= (motos_size.l/2);
      }
      if (joueur.dir == "bottom") {
        joueur.pos.y += (motos_size.l/2);
      }
      joueur.pos.x += (motos_size.l/2);
      client.emit('changeDir', joueur, gameId, 'right', CANVAS_SIZE);
      break;

    case 40:
      if (joueur.dir == "left") {
        joueur.pos.x -= (motos_size.l/2);
      }
      if (joueur.dir == "right") {
        joueur.pos.x += (motos_size.l/2);
      }
      joueur.pos.y += (motos_size.l/2);
      client.emit('changeDir', joueur, gameId, 'bottom', CANVAS_SIZE);
      break;

    case 80:
      clearInterval(gameLoopId);
      break;
  }
}

// - Fin d'une partie
function finish() {
  clearInterval(gameLoopId);

  if (joueur.status != "dead") {
    document.querySelector('#info').innerHTML = "GAGNÉ !";
    document.querySelector('#info').style.display = 'block';
    client.off('newPlayer');
    client.off('update');
    client.off('collide');
    document.removeEventListener('keydown', keydown);

    joueur.status = "winner";
    joueur.score += 20;
    joueur.win += 1;
    client.emit('winnerData', joueur, gameId);
  }
  client.on('displayRes', displayResData);
}

// - Affiche les résultats de la partie
function displayResData(room) {
  console.log(room);

  document.querySelector('#info').style.top = '25%';
  let resData = document.createElement('div');
  resData.id = 'resdata';
  let tableData = document.createElement('table');
  tableData.classList.add('game_table');

  let row1 = document.createElement('tr');

  let th1 = document.createElement('th');
  let th1_txt = document.createTextNode("Pseudo");
  th1.appendChild(th1_txt);
  row1.appendChild(th1);
  let th2 = document.createElement('th');
  let th2_txt = document.createTextNode("Score");
  th2.appendChild(th2_txt);
  row1.appendChild(th2);
  let th3 = document.createElement('th');
  let th3_txt = document.createTextNode("Victoire");
  th3.appendChild(th3_txt);
  row1.appendChild(th3);
  let th4 = document.createElement('th');
  let th4_txt = document.createTextNode("Défaite");
  th4.appendChild(th4_txt);
  row1.appendChild(th4);

  tableData.appendChild(row1);

  for (var i = 0; i < room.players.length; i++) {
    let row = document.createElement('tr');

    if (room.players[i].status == "winner") {
      row.id = "winner";
    }

    let td1 = document.createElement('td');
    let td1_txt = document.createTextNode(room.players[i].pseudo);
    td1.appendChild(td1_txt);
    row.appendChild(td1);
    let td2 = document.createElement('td');
    let td2_txt = document.createTextNode(room.players[i].score);
    td2.appendChild(td2_txt);
    row.appendChild(td2);
    let td3 = document.createElement('td');
    let td3_txt = document.createTextNode(room.players[i].win);
    td3.appendChild(td3_txt);
    row.appendChild(td3);
    let td4 = document.createElement('td');
    let td4_txt = document.createTextNode(room.players[i].lose);
    td4.appendChild(td4_txt);
    row.appendChild(td4);

    tableData.appendChild(row);
  }

  resData.appendChild(tableData);
  document.querySelector('#info').appendChild(resData);

  let btnReplay = document.createElement('button');
  btnReplay.id = "btnReplay";
  let btn_txt = document.createTextNode('REJOUER');
  btnReplay.appendChild(btn_txt);
  btnReplay.addEventListener("click", replay);
  document.querySelector('#info').appendChild(btnReplay);
}

// - Relance une partie
function replay() {
  client.off('displayRes');
  document.querySelector('#info').innerHTML = "";
  document.querySelector('#info').style.display = "none";
  document.querySelector('#info').style.top = "35%";

  joueur.status = "ready";
  client.emit('newGame', joueur, gameId, function(res) {
    if (res == "waitOther") {
      document.querySelector('#info').style.display = "block";
      document.querySelector('#info').innerHTML = "En attente d'autres joueur";
    }
  });
  client.on('drawReadyPlayer', drawReadyMoto);
  client.on('relaunch', function(room) {
    client.off('relaunch');
    console.log(room);
    console.log(joueur.pos);
    console.log(joueur.path);
    for (var i = 0; i < room.players.length; i++) {
      if (  room.players[i].id == joueur.id) {
        joueur.pos = scalePos(room.players[i], room.size);
        joueur.path = scalePath(room.players[i].path, room.size);
      }
    }
    console.log(joueur.pos);
    console.log(joueur.path);
    document.querySelector('#info').style.display = "block";

    launchGame(room);
  });
}

// - Dessine les motos de la nouvelle partie
function drawReadyMoto(data) {
  canvas_ctx.clearRect(0,0, CANVAS_SIZE, CANVAS_SIZE);
  for (var i = 0; i < data.players.length; i++) {
    if (data.players[i].status == "ready") {
      let pos = scalePos(data.players[i], data.size);
      canvas_ctx.fillStyle = data.players[i].color;
      if (data.players[i].dir == "bottom" || data.players[i].dir == "top") {
        canvas_ctx.fillRect(pos.x-(motos_size.w/2), pos.y-(motos_size.l/2), motos_size.w, motos_size.l);
      }
      if (data.players[i].dir == "left" || data.players[i].dir == "right") {
        canvas_ctx.fillRect(pos.x-(motos_size.l/2), pos.y-(motos_size.w/2), motos_size.l, motos_size.w);
      }
    }
  }
}
