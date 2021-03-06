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
    // food : {
    //   x : 7,
    //   y : 7,
    // },
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

    // if(state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y){
    // playerOne.snake.push({...playerOne.pos});

    // playerOne.pos.x += playerOne.velocity.x;
    // playerOne.pos.y += playerOne.velocity.y;
        // randomFood(state);
    // }

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

// function randomFood(state){
//     food = {
//         x: Math.floor(Math.random() * GRID_SIZE),
//         y: Math.floor(Math.random() * GRID_SIZE),
//     }
//     for(let cell of state.player.snake){
//         if (cell.x === food.x && cell.y === food.y)
//             return randomFood(state);
//     }
//     state.food = food;

// }

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