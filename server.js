const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const cors = require("cors");
app.use(cors());

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods:["GET", "POST"]
    }
});

let gameState = {
  t : Date.now(),
  playerArray: [{
    x: 5,
    y: 5,
    velocityX:0,
    velocityY:0,
    direction: 1.3082443894581433,
    id: "AhzgAtklgo2FJvwWAADO",
    hp: 100
  }],
    playerIDToIndex:new Map()
}
gameState.playerIDToIndex.set(`${gameState.playerArray[0].id}`, 0)
function update(){
  const lastTimestamp = gameState.t
  gameState.t = Date.now()
  const delta = (gameState.t - lastTimestamp) / 1000;

  for(i=0; i<gameState.playerArray.length; i++){
    let player = gameState.playerArray[i]
    if (player.moveForward === true && player.moveDown === false && player.moveLeft === false && player.moveRight === false) {
      player.velocityY = (player.velocityY - 1 * delta);
    }
    if (player.moveDown === true && player.moveForward === false && player.moveLeft === false && player.moveRight === false) {
      player.velocityY = (player.velocityY + 1 * delta);
    }
    if (player.moveLeft === true && player.moveDown === false && player.moveForward === false && player.moveRight === false) {
      player.velocityX = (player.velocityX - 1 * delta);
    }
    if (player.moveRight === true && player.moveDown === false && player.moveLeft === false && player.moveForward === false) {
      player.velocityX = (player.velocityX + 1 * delta);
    }
    if (player.moveForward === true && player.moveDown === false && player.moveLeft === true && player.moveRight === false) {
      player.velocityY = (player.velocityY - 0.5 * delta);
      player.velocityX = (player.velocityX - 0.5 * delta);
    }
    if (player.moveForward === true && player.moveDown === false && player.moveLeft === false && player.moveRight === true) {
      player.velocityY = (player.velocityY - 0.5 * delta);
      player.velocityX = (player.velocityX + 0.5 * delta);
    }
    if (player.moveDown === true && player.moveForward === false && player.moveLeft === true && player.moveRight === false) {
      player.velocityY = (player.velocityY + 0.5 * delta);
      player.velocityX = (player.velocityX - 0.5 * delta);
    }
    if (player.moveDown === true && player.moveForward === false && player.moveLeft === false && player.moveRight === true) {
      player.velocityY = (player.velocityY + 0.5 * delta);
      player.velocityX = (player.velocityX + 0.5 * delta);
    }
    //Need to omit ids from gamestate possibly
    io.to(gameState.playerArray[i].id).emit("gameState", gameState)
  }
}

gameState.interval = setInterval(update, 1000/60);

io.on('connection', (socket) => {
  console.log('A user connected');
  gameState.playerArray.push({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    moveRight: false,
    moveLeft: false,
    moveUp: false,
    moveDown: false,

    direction: 0,
    id: socket.id,
    hp: 100
  })
  const index = gameState.playerArray.length-1
  gameState.playerIDToIndex.set(`${gameState.playerArray[index].id}`, index)

  console.log(gameState.playerArray)

  socket.on('movement', (data) => {
    console.log('Received movement key:', data.key);
    const playerArrayPosition = gameState.playerIDToIndex[socket.id];
    if(data.key === 'w'){
      gameState.playerArray[playerArrayPosition].moveUp = true
    }
    if(data.key === 's'){
      gameState.playerArray[playerArrayPosition].moveDown = true
    }
    if(data.key === 'a'){
      gameState.playerArray[playerArrayPosition].moveLeft = true
    }
    if(data.key === 'd'){
      gameState.playerArray[playerArrayPosition].moveRight = true
    }
    // You can perform any necessary server-side logic here based on the received key.
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001; // Use the port you prefer
server.listen(3001, () => {
  console.log(`Server is running on port 3001`);
});
