const io = require('socket.io')();
const { createGameState, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');

// Début : MongoDB
const jwt = require('jsonwebtoken');
const Player = require("./models/Player");
const GameState = require("./models/GameState");

// Début  MongoClient
/*
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/tron";

MongoClient.connect(url,  {useNewUrlParser: true, useUnifiedTopology: true},function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});

*/

// Fin MongoClient


const mongoose = require("mongoose");
mongoose.connect('mongodb://127.0.0.1:27017/tron', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;

db.on('error', error => {
    console.log(error);
});

db.once('open', () => {
    console.log('Database Connection works !');
});


// Fin : MongoDB

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
    playing: false
};

io.on('connection', socket => {
    /*const state = createGameState();

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
    startGameInterval(client, state);*/
    console.log("New connection:", socket.id);
    socket.emit('welcome', socket.id, game.motos_available);

    socket.on('login', newPlayer);
    socket.on('ready', init);
    socket.on('updatePos', move);
    socket.on('changeDir', newDir);
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

    // Début : On récupère la liste des Joueurs
    Player.find(function (err, playersList) {
        if (err) {
            return console.error(err);
        }
        playersList.forEach(player_data => {
            console.log(player_data.loginID, player_data.name, player_data.score, player_data.motoColor)
            //player_data[1].name,
            //player_data[1].score
        })

        /*
        for(let i = 0; i < playersList.length; i = i +1) {
          console.log(playersList[i].name, playersList[i].score);
        }
        */
    });
    // Fin : On récupère la liste des Joueurs

});


function newPlayer(joueur, callback) {
    for (var i = 0; i < game.players.length; i++) {
        if (game.players[i].pseudo == joueur.pseudo) {
            console.log("pseudo-unavailable");
            return callback("pseudo-unavailable");
        }
    }

    //let login_player = Player.findOne({ name: joueur.pseudo});

    // Début De Création d'un Pseudo
    let player = new Player({
        loginID: joueur.id ,
        name: joueur.pseudo,
        motoColor: joueur.moto,
        score: 0,
    });
    player.save();
    // Fin De Création d'un Pseudo

    // Test 'mongodb://127.0.0.1:27017/
    //var dbo = db.db("tron");
    //db.collection("players").find({}, function(err, result) {
    //if (err) throw err;
    //console.log(result.name + 'Mon test');
    //db.close();
    //});

    // Test Fin



    joueur.pos = game.initial_positions[game.players.length];
    joueur.dir = game.initial_directions[game.players.length];
    joueur.path = game.initial_paths[game.players.length];

    if (game.playing) {
        joueur.status = "waiting";
    }
    game.players.push(joueur);

    game.motos_available.splice(game.motos_available.indexOf(joueur.moto), 1);
    console.log(joueur);
    console.log(game);
    callback(game);
    io.sockets.emit('newPlayer', game);
}



function init(callback) {
    if (game.players.length <= 1) {
        return callback("waitOther");
    }
    if (game.playing) {
        return callback("waitPlay")
    }
    if (game.players.length > 1 && game.playing == false) {


        // Début : Initialisation de l'état du Jeu
        let GameSate = new GameState({
            players: game.players,
            playerCount: game.players.length,
        });
        GameSate.save();
        // Fin : Initialisation de l'état du Jeu



        io.sockets.emit('init', game.players);
        game.playing = true;
        console.log(game.players);
        //setTimeout(updateGame, 5000);
    }
}

function move(playerID) {
    for (var i = 0; i < game.players.length; i++) {
        var x, y;
        if (game.players[i].id == playerID) {
            if (game.players[i].dir == "top") {
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
            }

            game.players[i].path.push({x: x, y: y});
            game.players[i].pos = {x: x, y: y};
            if (game.players[i].path.length > game.path_length) {
                game.players[i].path.shift();
            }
        }
    }
    io.sockets.emit('update', game);
}

function newDir(playerID, direction) {
    for (var i = 0; i < game.players.length; i++) {
        if (game.players[i].id == playerID) {
            var x, y;
            if (direction == "left") {
                game.players[i].dir = "left";
            }
            else if (direction == "bottom") {
                game.players[i].dir = "bottom";
            }
            else if (direction == "right") {
                game.players[i].dir = "right";
            }
            else {
                game.players[i].dir = "top";
            }
        }
    }
    io.sockets.emit('update', game);
}

function startGameInterval(){
    const intervalId = setInterval(() => {
        /*const winner = gameLoop(state);
        // console.log('interval');
        if( !winner ){
          client.emit('gameState', JSON.stringify(state));
        }else{
          client.emit('gameOver');
          clearInterval(intervalId);
        }*/

    }, 1500 / FRAME_RATE); //number of miliseconds to wait from each frame
}

io.listen(3000);
console.log("the server is running...");


