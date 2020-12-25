const io = require('socket.io')();
const { createGameState, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');

var game = {
  size: {width: 100, height: 100},
  players: [],
  motos_available: ["bleu", "orange", "rouge", "vert"],
  moto_size: {w: 7, l: 23},
  step: 2,
  path_length: 100,
  initial_positions: [
    {x: 50, y: 2},
    {x: 50, y: 94.5},
    {x: 2, y: 50},
    {x: 94.5, y: 50}
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
    }
    game.players.splice(id_j, 1);
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
  if (game.playing) {
    joueur.status = "waiting";
  }
  game.players.push(joueur);

  game.motos_available.splice(game.motos_available.indexOf(joueur.moto), 1);
  console.log(game);
  callback(game);
  io.sockets.emit('newPlayer', game);
}

function initPosPlayer(joueur, indice){

}

function init(callback) {
  if (game.players.length <= 1) {
    return callback("waitOther");
  }
  if (game.playing) {
    return callback("waitPlay")
  }
  if (game.players.length > 1 && game.playing == false) {
    io.sockets.emit('init', game.players);
    game.playing = true;
    console.log(game.players);
  }
}

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
