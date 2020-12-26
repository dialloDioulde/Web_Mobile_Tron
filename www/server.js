const io = require('socket.io')();
const { createGameState, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');

var moto_Availables = ["bleu", "orange", "rouge", "vert"];
var joueurs = [];
var playing = false;

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
  console.log(socket.id);
  socket.emit('welcome', socket.id);
  socket.emit('motoAvailable', moto_Availables);

  socket.on('login', newPlayer);
  socket.on('ready', init);

  socket.on('disconnect', function() {
    console.log("disconnect");
    console.log(socket.id);
    var id_j;
    for (var i = 0; i < joueurs.length; i++) {
      if (joueurs[i].id == socket.id) {
        moto_Availables.push(joueurs[i].moto);
        moto_Availables.sort();
        id_j = i;
      }
    }
    joueurs.splice(id_j, 1);
  });
});

function newPlayer(joueur, callback) {
  for (var i = 0; i < joueurs.length; i++) {
    if (joueurs[i].pseudo == joueur.pseudo) {
      console.log("pseudo-unavailable");
      return callback("pseudo-unavailable");
    }
  }

  joueurs.push(joueur);
  console.log(joueurs);
  moto_Availables.splice(moto_Availables.indexOf(joueur.moto), 1);
  return callback("player-added");
}

function init(callback) {
  if (joueurs.length <= 1) {
    return callback("waitOther");
  }
  if (playing) {
    return callback("waitPlay")
  }
  if (joueurs.length > 1 && playing == false) {
    io.sockets.emit('init');
    playing = true;
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
