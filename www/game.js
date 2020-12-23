const { GRID_SIZE } = require('./constants');

module.exports = {
    createGameState,
    gameLoop,
    getUpdatedVelocity,
}

function createGameState(){

 return {
    player : {
      pos: {
        x : 3,
        y : 10,
      },
      velocity : {
        x : 1,
        y : 0,
      },
      snake : [
        {x : 1,y : 10},
        {x : 2,y : 10},
        {x : 3,y : 10},
      ]
    },
    gridsize : GRID_SIZE,
    active: true,
  };
}

function gameLoop(state){
    if(!state){
        return;
    }

    const playerOne = state.player;
    playerOne.pos.x += playerOne.velocity.x;
    playerOne.pos.y += playerOne.velocity.y;

    if(playerOne.pos.x < 0 || playerOne.pos.x > GRID_SIZE
        || playerOne.pos.y < 0 || playerOne.pos.y > GRID_SIZE)
    {
        return 2;
    }


    if(playerOne.velocity.x || playerOne.velocity.y){
        //check if the snake hasnt run into himself
        for(let cell of playerOne.snake){
            if(cell.x === playerOne.pos.x && cell.y === playerOne.pos.y){
                return 2;
            }
        }

        playerOne.snake.push({...playerOne.pos});
        // playerOne.snake.shift();
    }
    return false;
}

function getUpdatedVelocity(keyCode){
    switch(keyCode){
        case 37: { //left
            return { x: -1, y: 0 };
        }
        case 38: {//down
            return { x: 0, y: -1 };
        }
        case 39: {//right
            return { x: 1, y: 0} ;
        }
        case 40: {//up
            return { x: 0, y: 1} ;
        }
    }
}
