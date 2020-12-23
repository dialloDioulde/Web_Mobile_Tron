const io = require('socket.io')();
const { createGameState, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');

var moto_Availables = ["bleu", "orange", "rouge", "vert"];
var joueurs = [];

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
  socket.emit('motoAvailable', moto_Availables)
  socket.on('login', newGamer);

  socket.on('disconnect', function() {
    console.log("disconnect");
    console.log(socket.id);
    for (var i = 0; i < joueurs.length; i++) {
      if (joueurs[i].id == socket.id) {
        moto_Availables.push(joueurs[i].moto);
        moto_Availables.sort();
      }
    }
  });
});


function newGamer(joueur){
  joueurs.push(joueur);
  console.log(joueur.pseudo);
  console.log(joueur.moto);
  moto_Availables.splice(moto_Availables.indexOf(joueur.moto), 1);
  console.log(moto_Availables);
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
