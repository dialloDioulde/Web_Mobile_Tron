const io = require('socket.io')();

var rooms = [];     // tableau des différentes parties en cours
var clients = [];   // tableau des clients connectés au serveur

// - Classe représentant une partie
class Game {
  constructor(name, nbMinPlayers){
    this.name = name,                                           // nom de la partie (identifiant)
    this.size = {width: 100, height: 100},                      // taille du canvas virtuelle pour le serveur
    this.players = [],                                          // tableau des joueurs de la partie
    this.motos_available = ["bleu", "orange", "rouge", "vert"], // tableau des motos disponibles de la partie
    this.moto_size = {w: 1, l: 4},                              // taille des motos
    this.step = 4,                                              // pas de déplacement des motos
    this.path_length = 100,                                     // longueur maximale de la trace des motos
    this.initial_positions = [                                  // tableau des positions initiales des motos
      {x: 50, y: 4},
      {x: 50, y: 96},
      {x: 4, y: 50},
      {x: 96, y: 50}
    ],
    this.initial_paths = [                                      // tableau des valeures initiales des traces des motos
      [{x: 50, y: 4}],
      [{x: 50, y: 96}],
      [{x: 4, y: 50}],
      [{x: 96, y: 50}]
    ],
    this.initial_directions = ["bottom", "top", "right", "left"], // directions initiales des motos
    this.playing = false,                                         // statut de la partie
    this.nbPlayers_alive = 0,                                     // nombre de joueur en vie
    this.nbMinPlayers = nbMinPlayers                              // nombre minimal pour jouer
  }
};

//************* Début : Connexion à MongoDB  *************************************************************************//
const Player = require("./models/Player");
const mongoose = require("mongoose");
mongoose.connect('mongodb://127.0.0.1:27017/tron', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
const db = mongoose.connection;

db.on('error', error => {
  console.log(error);
});

db.once('open', () => {
  console.log('Database Connection works !');
});
//************* Fin : Connexion à MongoDB  ***************************************************************************//

// - Récupère la connexion d'un client
io.on('connection', socket => {
  console.log("New connection:", socket.id);
  clients.push(socket);
  socket.emit('welcome', socket.id, rooms);

  socket.on('createGame', createGame);
  socket.on('selectRoom', selectRoom);

  socket.on('login', newPlayer);
  socket.on('ready', init);

  socket.on('updatePos', move);
  socket.on('changeDir', newDir);

  socket.on('winnerData', saveWinner);
  socket.on('looserData', saveLooser);
  socket.on('resData', function(roomID, callback) {
    return callback(rooms[roomID]);
  });

  socket.on('newGame', relaunch);

  socket.on('disconnect', function() {
    console.log("disconnect");
    console.log(socket.id);
    var id_r, id_j;
    for (var i = 0; i < rooms.length; i++) {
      for (var j = 0; j < rooms[i].players.length; j++) {
        if (rooms[i].players[j].id == socket.id) {
          rooms[i].motos_available.push(rooms[i].players[j].moto);
          rooms[i].motos_available.sort();
          id_r = i;
          id_j = j;
        }

        if (rooms[i].players[j].status == "waiting") {
          rooms[i].players[j].status = "ready";
        }
      }
    }

    if (id_r != undefined && id_j != undefined) {
      socket.leave(rooms[id_r].name);
      rooms[id_r].players.splice(id_j, 1);

      if (rooms[id_r].players.length <= 1) {
        rooms[id_r].playing = false;
      }
    }

  });
});

// - Créer une nouvelle partie dans le tableau rooms[]
function createGame(name, nbJoueurs, callback) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].name == name) {
      console.log("name-unavailable");
      return callback("name-unavailable", null, 0);
    }
  }

  let newGame = new Game(name, nbJoueurs);
  rooms.push(newGame);
  return callback("", newGame, rooms.indexOf(newGame));
}

// - Retourne les données de la partie sélectionner
function selectRoom(roomID, callback) {
  return callback(rooms[roomID]);
}

// - Créer, initialise et ajoute un nouveau joueur
function newPlayer(joueur, roomID, callback) {
  for (var i = 0; i < rooms[roomID].players.length; i++) {
    if (rooms[roomID].players[i].pseudo == joueur.pseudo) {
      console.log("pseudo-unavailable");
      return callback("pseudo-unavailable");
    }
  }
  let j = Object.assign({}, joueur);
  j.pos = Object.assign({}, rooms[roomID].initial_positions[rooms[roomID].players.length]);
  j.dir = rooms[roomID].initial_directions[rooms[roomID].players.length];
  j.path = rooms[roomID].initial_paths[rooms[roomID].players.length].slice();

  if (rooms[roomID].playing) {
    j.status = "waiting";
  }
  rooms[roomID].players.push(j);

  // ************** Début :  Création d'un Joueur ******************************************************************* //
  Player.findOne({name: joueur.pseudo}, function (err, pl_pseudo) {
    if (err) return handleError(err);
    if(pl_pseudo == null){
      let player = new Player({
        loginID: joueur.id ,
        name: joueur.pseudo,
        motoColor: joueur.moto,
        status: "living",
        score: 0,
      });
      player.save();
      console.log(" Pseudo créé : Création " );
    }else{
      Player.findOneAndUpdate({name: joueur.pseudo}, {loginID: joueur.id, motoColor: joueur.moto,
        status: "living", score: 0}, function(err, pl_data){
        if (err){
          console.log("errr",err);
        }else{
          console.log(" Pseudo créé : Mise à Jour " );
        }
      });
    }
  });
  // ************** Fin : Création d'un Joueur ********************************************************************** //

  for (var i = 0; i < clients.length; i++) {
    if (clients[i].id == joueur.id) {
      clients[i].join(rooms[roomID].name);
    }
  }

  rooms[roomID].motos_available.splice(rooms[roomID].motos_available.indexOf(j.moto), 1);
  console.log(j);
  console.log(rooms[roomID]);
  callback(rooms[roomID]);

  io.to(rooms[roomID].name).emit('newPlayer', rooms[roomID]);
}

// - Attend le bon nombre de joueur pour lancer la partie
function init(roomID, callback) {
  if (rooms[roomID].players.length < rooms[roomID].nbMinPlayers) {
    return callback("waitOther");
  }
  if (rooms[roomID].playing) {
    return callback("waitPlay")
  }
  if (rooms[roomID].players.length == rooms[roomID].nbMinPlayers && rooms[roomID].playing == false) {
    rooms[roomID].playing = true;
    rooms[roomID].nbPlayers_alive = rooms[roomID].players.length;

    io.to(rooms[roomID].name).emit('init', rooms[roomID]);
    console.log(rooms[roomID].nbPlayers_alive);
  }
}

// - Normalise les positions du joueur
function normalizePlayer(position, scale, roomID) {
  var x = parseFloat(((position.x/scale) * rooms[roomID].size.width).toFixed(2));
  var y = parseFloat(((position.y/scale) * rooms[roomID].size.height).toFixed(2));
  return {x: x, y: y};
}

// - Met à jour la position du joueur
function move(player, roomID, scale) {
  var playerID = player.id;
  var posNormalize = normalizePlayer(player.pos, scale, roomID);

  for (var i = 0; i < rooms[roomID].players.length; i++) {
    if (rooms[roomID].players[i].id == playerID) {
      checkCollision(roomID, i);
      rooms[roomID].players[i].pos.x = posNormalize.x;
      rooms[roomID].players[i].pos.y = posNormalize.y;
      rooms[roomID].players[i].path.push(posNormalize);
      rooms[roomID].players[i].score = player.score;

      if (rooms[roomID].players[i].path.length > rooms[roomID].path_length) {
        rooms[roomID].players[i].path.shift();
      }
    }
  }
  io.to(rooms[roomID].name).emit('update', rooms[roomID]);
}

// - Met à jour la position du joueur lors d'un changment de direction
function newDir(player, roomID, direction, scale) {
  var playerID = player.id;
  var posNormalize = normalizePlayer(player.pos, scale, roomID);

  for (var i = 0; i < rooms[roomID].players.length; i++) {
    if (rooms[roomID].players[i].id == playerID) {
      checkCollision(roomID, i);

      if (rooms[roomID].players[i].dir == "top" || rooms[roomID].players[i].dir == "bottom") {
          if (direction == "left" || direction == "right") {
            rooms[roomID].players[i].path.push({x: rooms[roomID].players[i].pos.x, y: posNormalize.y});
          }
      }
      if (rooms[roomID].players[i].dir == "left" || rooms[roomID].players[i].dir == "right") {
          if (direction == "top" || direction == "bottom") {
            rooms[roomID].players[i].path.push({x: posNormalize.x, y: rooms[roomID].players[i].pos.y});
          }
      }

      rooms[roomID].players[i].path.push(posNormalize);
      rooms[roomID].players[i].pos.x = posNormalize.x;
      rooms[roomID].players[i].pos.y = posNormalize.y;
      rooms[roomID].players[i].dir = direction;
    }
  }
  io.to(rooms[roomID].name).emit('update', rooms[roomID]);
}

// - Vérifie si le joueur rentre en collision
function checkCollision(roomID, playerID) {
  var myPos = Object.assign({}, rooms[roomID].players[playerID].pos);

  if (rooms[roomID].players[playerID].dir == "top") {
    myPos = {x: myPos.x, y: myPos.y-(rooms[roomID].moto_size.l/2)};
  }
  if (rooms[roomID].players[playerID].dir == "bottom") {
    myPos = {x: myPos.x, y: myPos.y+(rooms[roomID].moto_size.l/2)};
  }
  if (rooms[roomID].players[playerID].dir == "left") {
    myPos = {x: myPos.x-(rooms[roomID].moto_size.l/2), y: myPos.y};
  }
  if (rooms[roomID].players[playerID].dir == "right") {
    myPos = {x: myPos.x+(rooms[roomID].moto_size.l/2), y: myPos.y};
  }

  for (var i = 0; i < rooms[roomID].players.length; i++) {
    if (i != playerID) {
      var ennemiPath = rooms[roomID].players[i].path.slice();

      // - détection de collision avec un adversaire
      for (var j = 0; j < ennemiPath.length; j++) {
        if (   myPos.x == ennemiPath[j].x && myPos.y == ennemiPath[j].y
            || myPos.x == ennemiPath[j].x && myPos.y == ennemiPath[j].y+2
            || myPos.x == ennemiPath[j].x && myPos.y == ennemiPath[j].y-2
            || myPos.x == ennemiPath[j].x+2 && myPos.y == ennemiPath[j].y
            || myPos.x == ennemiPath[j].x-2 && myPos.y == ennemiPath[j].y
            || myPos.x == ennemiPath[j].x+2 && myPos.y == ennemiPath[j].y+2
            || myPos.x == ennemiPath[j].x-2 && myPos.y == ennemiPath[j].y-2
            || myPos.x == ennemiPath[j].x+2 && myPos.y == ennemiPath[j].y-2
            || myPos.x == ennemiPath[j].x-2 && myPos.y == ennemiPath[j].y+2) {

              rooms[roomID].players[playerID].status = "dead";
              //rooms[roomID].nbPlayers_alive--;
              io.to(rooms[roomID].players[playerID].id).emit('collide', rooms[roomID], rooms[roomID].players[playerID].id);
              console.log("COLLIDE !!!");
        }
      }
    }
  }

  // - détection de collision avec le bord du canvas
  if (myPos.x >= rooms[roomID].size.width || myPos.x <= 0 || myPos.y >= rooms[roomID].size.height || myPos.y <= 0) {
    rooms[roomID].players[playerID].status = "dead";
    //rooms[roomID].nbPlayers_alive--;
    io.to(rooms[roomID].players[playerID].id).emit('collide', rooms[roomID], rooms[roomID].players[playerID].id);
    console.log("COLLIDE !!!");
  }

  // - détection de collision avec soi-même
  var myPath = rooms[roomID].players[playerID].path;
  for (var k = 0; k < myPath.length-1; k++) {
    if (   myPos.x == myPath[k].x && myPos.y == myPath[k].y
        || myPos.x == myPath[k].x && myPos.y == myPath[k].y+2
        || myPos.x == myPath[k].x && myPos.y == myPath[k].y-2
        || myPos.x == myPath[k].x+2 && myPos.y == myPath[k].y
        || myPos.x == myPath[k].x-2 && myPos.y == myPath[k].y
        || myPos.x == myPath[k].x+2 && myPos.y == myPath[k].y+2
        || myPos.x == myPath[k].x-2 && myPos.y == myPath[k].y-2
        || myPos.x == myPath[k].x+2 && myPos.y == myPath[k].y-2
        || myPos.x == myPath[k].x-2 && myPos.y == myPath[k].y+2) {

          rooms[roomID].players[playerID].status = "dead";
          //rooms[roomID].nbPlayers_alive--;
          io.to(rooms[roomID].players[playerID].id).emit('collide', rooms[roomID], rooms[roomID].players[playerID].id);
          console.log("COLLIDE !!!");
    }
  }

  if (rooms[roomID].nbPlayers_alive == 1) {
    io.to(rooms[roomID].name).emit('finish');
  }
}

// - Enregistre les données du gagnant
function saveWinner(data, roomID) {
  rooms[roomID].playing = false;

  if(data.status === "winner"){
    Player.findOneAndUpdate({name: data.pseudo}, {status: "winner", score: data.score}, function(err, pl_data){
      if (err){
        console.log("errr",err);
      }else{
        console.log(" You " + "("+ pl_data.name +")" + " are the" + " WINNER " + pl_data.score);
      }
    });
  }

  for (var i = 0; i < rooms[roomID].players.length; i++) {
    if (rooms[roomID].players[i].id == data.id) {
      rooms[roomID].players[i].status = data.status;
      rooms[roomID].players[i].score = data.score;
      rooms[roomID].players[i].win = data.win;
    }
    if (rooms[roomID].players[i].status == "dead") {
      rooms[roomID].players[i].score -= 20;
      rooms[roomID].players[i].lose += 1;
    }
  }

  rooms[roomID].nbPlayers_alive = 0;
  io.to(rooms[roomID].name).emit('displayRes', rooms[roomID]);
}

// - Enregistre les données des perdants
function saveLooser(data, roomID) {
  if(data.status === "dead"){
    Player.findOneAndUpdate({name: data.pseudo}, {status: "dead", score: data.score}, function(err, pl_data){
      if (err){
        console.log("errr",err);
      }else{
        console.log(" You " + "("+ pl_data.name +")" + " are the" + " LOSER " + pl_data.score);
      }
    });
  }
  rooms[roomID].nbPlayers_alive -= 1;
  /*if (rooms[roomID].nbPlayers_alive) {

  }*/
  console.log(rooms[roomID].nbPlayers_alive);
}

// - Relance une partie
function relaunch(player, roomID, callback) {
  for (var i = 0; i < rooms[roomID].players.length; i++) {
    if (rooms[roomID].players[i].id == player.id) {
      rooms[roomID].players[i].pos = Object.assign({}, rooms[roomID].initial_positions[i]);
      rooms[roomID].players[i].path = rooms[roomID].initial_paths[i].slice();
      rooms[roomID].players[i].dir = rooms[roomID].initial_directions[i];
      rooms[roomID].players[i].status = "ready";
      rooms[roomID].nbPlayers_alive += 1;
      io.to(rooms[roomID].name).emit('drawReadyPlayer', rooms[roomID]);
    }
  }

  if (rooms[roomID].nbPlayers_alive == rooms[roomID].nbMinPlayers) {
    for (var i = 0; i < rooms[roomID].players.length; i++) {
      if (rooms[roomID].players[i].status == "waiting") {
        rooms[roomID].players[i].status = "ready";
        rooms[roomID].nbPlayers_alive += 1;
      }
    }
    rooms[roomID].playing = true;
    console.log("relaunch");
    console.log(rooms[roomID]);
    io.to(rooms[roomID].name).emit('relaunch', rooms[roomID]);
  }
  else {
    console.log("wait");
    return callback("waitOther");
  }
}

io.listen(3000);
console.log("the server is running...");
