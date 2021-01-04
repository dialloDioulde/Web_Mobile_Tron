
const io = require('socket.io')();

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

//let roomName = makeid(5);
//const gameRooms = {};
const numberPlayersStart = Math.floor(Math.random() * Math.floor(2)) + 1;


var game = {
  size: {width: 100, height: 100},
  players: [],
  motos_available: ["bleu", "orange", "rouge", "vert"],
  moto_size: {w: 7, l: 24},
  step: 2,
  path_length: 100,
  initial_positions: [
    {x: 50, y: 2},
    {x: 50, y: 94.5},
    {x: 2, y: 50},
    {x: 94.5, y: 50}
  ],
  initial_paths: [
    [{x: 50, y: 2}],
    [{x: 50, y: 98}],
    [{x: 2, y: 50}],
    [{x: 98, y: 50}]
  ],
  initial_directions: ["bottom", "top", "right", "left"],
  playing: false,
  gameOver: false,
  nbPlayers_alive: 0,
  numberPlayersStart: numberPlayersStart
};

io.on('connection', socket => {
    console.log("New connection:", socket.id);
    socket.emit('welcome', socket.id, game.motos_available);

//    gameRooms[socket.id] = roomName;
//ROOMS
//    let roomName = makeid(5);
//    gameRooms[socket.id] = roomName;
//    socket.emit('gameCode', roomName);
//
//    state[roomName] = initGame();
//
//    socket.join(roomName);
//    socket.number = 1;
//    socket.emit('initGame', 1);
//END ROOMS
    socket.on('login', newPlayer);
    socket.on('ready', init);
    socket.on('updatePos', move);
    socket.on('changeDir', newDir);
    socket.on('collision', collide);

  //************************ Début : Enregistrement Des Statistiques Du Jeu dans la BDD ******************************//
  // GAGNANT
  socket.on('winnerData', function (data) {
    if(data.status === "winner" && data.lose === "No" && data.win === "Winner"){
      Player.findOneAndUpdate({name: data.pseudo}, {status: "winner", score: data.score}, function(err, pl_data){
        if (err){
          console.log("errr",err);
        }else{
          console.log(" You " + "("+ pl_data.name +")"  +  " are the  "  + " WINNER " + pl_data.score + "" );
        }
      });
      console.log(data);
    }
  });
  //******************************************************************************************************************//
  // PERDANT(S)
  socket.on('looserData', function (data) {
    if(data.status === "dead" && data.lose === "Looser" && data.win === "No"){
      Player.findOneAndUpdate({name: data.pseudo}, {status: "dead", score: data.score}, function(err, pl_data){
        if (err){
          console.log("errr",err);
        }else{
          console.log(" You " + "("+ pl_data.name +")"  +  " are the  "  + " LOOSER " + pl_data.score + "" );
        }
      });
      console.log(data);
    }
  });
  //************************ Fin : Enregistrement Des Statistiques Du Jeu dans la BDD ********************************//



//************************************** Relaunch ****************************************************************************//
socket.on('relaunch', function (game, callback) {
//    var temp_game = game;

//  if(game.gameOver && !game.playing){
//    temp_game = game;
//    game.size = {width: 100, height: 100};

    for(var i = 0 ; i <  game.players.length; i ++){
         game.players[i].pos = game.initial_positions[i];
         game.players[i].dir = game.initial_directions[i];
         game.players[i].path = game.initial_paths[i];
         game.players[i].status = "ready";
         game.motos_available.splice(game.motos_available.indexOf(game.players[i]), 1);
           //console.log(joueur);
         console.log(game.players[i].pos);
    }
    game.moto_size = {w: 7, l: 24};
    game.step = 2;
    game.path_length = 100;
    game.initial_positions = [
                  {x: 50, y: 2},
                  {x: 50, y: 94.5},
                  {x: 2, y: 50},
                  {x: 94.5, y: 50}
                ];
    game.initial_paths = [
                  [{x: 50, y: 2}],
                  [{x: 50, y: 98}],
                  [{x: 2, y: 50}],
                  [{x: 98, y: 50}]
                ];
    game.initial_directions = ["bottom", "top", "right", "left"],
    game.playing = false,
    game.gameOver = false,
    game.nbPlayers_alive = game.players.length;
//    game = temp_game;
//    callback(game);
    io.sockets.emit('init', game);
    callback(game);

//   }
});
//******************************************************************************************************************//

  socket.on('disconnect', function() {
    console.log("disconnect");
    console.log(socket.id);
    var id_j;
    for (var i = 0; i < game.players.length; i++) {
      if (game.players[i].id == socket.id) {
        game.motos_available.push(game.players[i].moto);
        game.motos_available.sort();
        id_j = i;
      }

      if (game.players[i].status == "waiting") {
        game.players[i].status = "ready";
      }
    }
    game.players.splice(id_j, 1);

    if (game.players.length < 1) {
      game.playing = false;
    }
  });
});

function newPlayer(joueur, callback) {
  for (var i = 0; i < game.players.length; i++) {
    if (game.players[i].pseudo == joueur.pseudo) {
      console.log("pseudo-unavailable");
      return callback("pseudo-unavailable");
    }
  }

  joueur.pos = game.initial_positions[game.players.length];
  joueur.dir = game.initial_directions[game.players.length];
  joueur.path = game.initial_paths[game.players.length];

  if (game.playing) {
  //shto room ketu
    joueur.status = "waiting";
  }
  game.players.push(joueur);

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

  game.motos_available.splice(game.motos_available.indexOf(joueur.moto), 1);
  //console.log(joueur);
  //console.log(game);
  callback(game);

  //################
  io.sockets.emit('newPlayer', game);

}


function init(callback) {
  if (game.players.length <= numberPlayersStart) {
    return callback("waitOther");
  }
  if (game.playing) {
    return callback("waitPlay");
  }
  if (game.players.length > numberPlayersStart && game.playing == false) {
    io.sockets.emit('init', game);
    game.playing = true;
    game.nbPlayers_alive = game.players.length;
//    console.log(game.players);
  }
//  if(game.gameOver && game.playing){
//        for(let i=0; i < game.players.length; i++){
//              game.motos_available.splice(game.motos_available.indexOf(game.players[i]), 1);
//              callback(game);
//              io.sockets.emit('newPlayer', game);
//        }
//  }
  //#shih ketu
}

function move(player, scale) {
  var playerID = player.id;
  var posNormalize = normalizePlayer(player.pos, scale);
  for (var i = 0; i < game.players.length; i++) {
    var x, y;
    if (game.players[i].id == playerID) {
      game.players[i].pos.x = posNormalize.x;
      game.players[i].pos.y = posNormalize.y;
      /*if (game.players[i].dir == "top") {
        x = game.players[i].pos.x;
        y = game.players[i].pos.y - game.step;
      }
      else if (game.players[i].dir == "left") {
        x = game.players[i].pos.x - game.step;
        y = game.players[i].pos.y;
      }
      else if (game.players[i].dir == "right") {
        x = game.players[i].pos.x + game.step;
        y = game.players[i].pos.y;
      }
      else {
        x = game.players[i].pos.x;
        y = game.players[i].pos.y + game.step;
      }*/

      game.players[i].path.push(posNormalize);
      //game.players[i].pos = {x: x, y: y};
      if (game.players[i].path.length > game.path_length) {
        game.players[i].path.shift();
      }
    }
  }
  io.sockets.emit('update', game);
}

function normalizePlayer(position, scale) {
  var x = parseFloat(((position.x/scale) * game.size.width).toFixed(2));
  var y = parseFloat(((position.y/scale) * game.size.height).toFixed(2));
  return {x: x, y: y};
}

function newDir(playerID, direction) {
  //var playerID = player.id;
  //console.log(player.pos);
  //var posNormalize = normalizePlayer(player.pos, scale);
  //console.log(posNormalize);

  for (var i = 0; i < game.players.length; i++) {
    if (game.players[i].id == playerID) {
      /*game.players[i].pos.x = posNormalize.x;
      game.players[i].pos.y = posNormalize.y;*/
      game.players[i].dir = direction;
      /*var x, y;
      if (direction == "left") {
        x = game.players[i].pos.x - game.step;
        y = game.players[i].pos.y;
        game.players[i].dir = "left";
      }
      else if (direction == "bottom") {
        x = game.players[i].pos.x;
        y = game.players[i].pos.y + game.step;
        game.players[i].dir = "bottom";
      }
      else if (direction == "right") {
        x = game.players[i].pos.x + game.step;
        y = game.players[i].pos.y;
        game.players[i].dir = "right";
      }
      else {
        x = game.players[i].pos.x;
        y = game.players[i].pos.y - game.step;
        game.players[i].dir = "top";
      }*/

      //game.players[i].path.push(posNormalize);
      //game.players[i].pos = {x: x, y: y};
      /*if (game.players[i].path.length > game.path_length) {
        game.players[i].path.shift();
      }*/
    }
  }
  io.sockets.emit('update', game);
}

function collide(playerID) {
  for (var i = 0; i < game.players.length; i++) {
    if (game.players[i].id == playerID) {
      game.players[i].status = "dead";
      game.nbPlayers_alive--;
      game.initial_positions = [
          {x: 50, y: 2},
          {x: 50, y: 94.5},
          {x: 2, y: 50},
          {x: 94.5, y: 50}
      ];
      game.initial_paths= [
          [{x: 50, y: 2}],
          [{x: 50, y: 98}],
          [{x: 2, y: 50}],
          [{x: 98, y: 50}]
      ];
      verifyDead = true;
    }
  }
  if (game.nbPlayers_alive == 1) {
    io.sockets.emit('finish', game);
    game.gameOver = true;
    game.playing = false;
  }
  io.sockets.emit('collide', game);

}

io.listen(3000);
console.log("the server is running...");
