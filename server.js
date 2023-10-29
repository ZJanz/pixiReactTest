const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const cors = require("cors");
app.use(cors());

let d3Quadtree;
let io;

import('d3-quadtree')
  .then(module => {
    d3Quadtree = module;
    startServer();
  })
  .catch(error => {
    console.error('Error importing d3-quadtree:', error);
  });

function startServer() {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  let gameState = {
    t: Date.now(),
    playerArray: [{
      rotation: 0,
      x: 5,
      y: 5,
      velocityX: 0,
      velocityY: 0,
      id: "AhzgAtklgo2FJvwWAADO",
      hp: 100
    }],
    playerIDToIndex: new Map(),
    shipArray: [{
      id: 0,
      alive: true,
      controledBy: 0,
      rotation: 0,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      moveForward: false,
      rotationVelocity: 0,
      rotation: 0,
      shipRooms: [
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [3, 1, 1, 1, 2],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      playersOnShip: [0],
      speed: 0.1
    }],
  };
  gameState.playerIDToIndex.set(`${gameState.playerArray[0].id}`, 0);

  let gameSpace = d3Quadtree.quadtree(gameState.shipArray, d => d.x, d => d.y);

  function update() {
    const lastTimestamp = gameState.t;
    gameState.t = Date.now();
    const delta = (gameState.t - lastTimestamp) / 16;

    gameSpace = d3Quadtree.quadtree(gameState.shipArray, d => d.x, d => d.y);

    for (let i = 0; i < gameState.playerArray.length; i++) {
      let player = gameState.playerArray[i];

      if (player.moveForward === true && player.moveDown === false && player.moveLeft === false && player.moveRight === false) {
        player.y = (player.y - 1 * delta);
      }
      if (player.moveDown === true && player.moveForward === false && player.moveLeft === false && player.moveRight === false) {
        player.y = (player.y + 1 * delta);
      }
      if (player.moveLeft === true && player.moveDown === false && player.moveForward === false && player.moveRight === false) {
        player.x = (player.x - 1 * delta);
      }
      if (player.moveRight === true && player.moveDown === false && player.moveLeft === false && player.moveForward === false) {
        player.x = (player.x + 1 * delta);
      }
      if (player.moveForward === true && player.moveDown === false && player.moveLeft === true && player.moveRight === false) {
        player.y = (player.y - 0.5 * delta);
        player.x = (player.x - 0.5 * delta);
      }
      if (player.moveForward === true && player.moveDown === false && player.moveLeft === false && player.moveRight === true) {
        player.y = (player.y - 0.5 * delta);
        player.x = (player.x + 0.5 * delta);
      }
      if (player.moveDown === true && player.moveForward === false && player.moveLeft === true && player.moveRight === false) {
        player.y = (player.y + 0.5 * delta);
        player.x = (player.x - 0.5 * delta);
      }
      if (player.moveDown === true && player.moveForward === false && player.moveLeft === false && player.moveRight === true) {
        player.y = (player.y + 0.5 * delta);
        player.x = (player.x + 0.5 * delta);
      }

      io.to(player.id).emit("gameState", gameState);
    }

    for (let i = 0; i < gameState.shipArray.length; i++) {
      // Remove ship from quadtree before position update
    gameSpace.remove(gameState.shipArray[i]);

      if (gameState.shipArray[i].rotateLeft === true) {
        gameState.shipArray[i].rotationVelocity = (gameState.shipArray[i].rotationVelocity - 0.01 * delta * gameState.shipArray[i].speed);
      }
      if (gameState.shipArray[i].rotateRight === true) {
        gameState.shipArray[i].rotationVelocity = (gameState.shipArray[i].rotationVelocity + 0.01 * delta * gameState.shipArray[i].speed);
      }
      if (gameState.shipArray[i].moveForward === true) {
        const angleInRadians = gameState.shipArray[i].rotation;
        gameState.shipArray[i].velocityX += Math.cos(angleInRadians) * 1 * delta * gameState.shipArray[i].speed;
        gameState.shipArray[i].velocityY += Math.sin(angleInRadians) * 1 * delta * gameState.shipArray[i].speed;
      }
      gameState.shipArray[i].rotation += (gameState.shipArray[i].rotationVelocity * delta);

      gameState.shipArray[i].x += (gameState.shipArray[i].velocityX * delta);
      gameState.shipArray[i].y += (gameState.shipArray[i].velocityY * delta);

      // Perform collision logic...

      const nearbyShips = [];
      gameSpace.visit(function(node, x1, y1, x2, y2) {
        if (!node.length) {
          do {
            const otherShip = node.data;
            const distance = Math.sqrt((otherShip.x - gameState.shipArray[i].x) ** 2 + (otherShip.y - gameState.shipArray[i].y) ** 2);
            if (distance < 100 && otherShip !== gameState.shipArray[i]) {
              nearbyShips.push(otherShip);
            }
          } while (node = node.next);
        }
        return x1 > gameState.shipArray[i].x + 100 || x2 < gameState.shipArray[i].x - 100 || y1 > gameState.shipArray[i].y + 100 || y2 < gameState.shipArray[i].y - 100;
      });

      nearbyShips.forEach(otherShip => {
        const distance = Math.sqrt((otherShip.x - gameState.shipArray[i].x) ** 2 + (otherShip.y - gameState.shipArray[i].y) ** 2);
        if (distance < 20) {
          console.log("Collision");
          // Perform collision handling here...
        }
      })
      

    }
  }

  gameState.interval = setInterval(update, 1000 / 60);

  io.on('connection', (socket) => {
    console.log('A user connected');
    gameState.playerArray.push({
      x: 64*5/2,
      y: 64*5/2,
      mode: 1,
      velocityX: 0,
      velocityY: 0,
      moveRight: false,
      moveLeft: false,
      moveForward: false,
      moveDown: false,
      rotationVelocity: 0,
      rotation: 0,
      insideShip:gameState.shipArray.length,
      controllingShip:gameState.shipArray.length,
      direction: 0,
      id: socket.id,
      hp: 100
    })
    gameState.shipArray.push({
        id: gameState.shipArray.length,
        alive: true,
        controledBy: gameState.playerArray.length-1,
        rotation:0,
        x: 0,
        y: 0,
        velocityX:0,
        velocityY:0,
        moveForward: false,
        rotationVelocity: 0,
        rotation: 0,
        speed:0.1,
        shipRooms:[
          [0,0,0,0,0],
          [0,0,1,0,0],
          [3,1,1,1,2],
          [0,0,1,0,0],
          [0,0,0,0,0]
      ],
        playersOnShip:[gameState.playerArray.length-1]
      
    })
    console.log(gameState.shipArray[gameState.shipArray.length-1])

    const index = gameState.playerArray.length-1
    gameState.playerIDToIndex.set(`${gameState.playerArray[index].id}`, index)
  
    io.to(socket.id).emit("indexInPlayerArray", index)
  
    socket.on('movement', (data) => {
      console.log('Received movement key:', data.key);
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      if(playerArrayPosition === undefined){return}
      const ship = gameState.playerArray[playerArrayPosition].insideShip
      if(data.key === 'w' && gameState.playerArray[playerArrayPosition].mode === 0){
        gameState.playerArray[playerArrayPosition].moveForward = true
      }
      if(data.key === 's' && gameState.playerArray[playerArrayPosition].mode === 0){
        gameState.playerArray[playerArrayPosition].moveDown = true
      }
      if(data.key === 'a' && gameState.playerArray[playerArrayPosition].mode === 0){
        gameState.playerArray[playerArrayPosition].moveLeft = true
      }
      if(data.key === 'd' && gameState.playerArray[playerArrayPosition].mode === 0){
        gameState.playerArray[playerArrayPosition].moveRight = true
      }
      if(data.key === 'w' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipArray[ship].moveForward = true
      }
      if(data.key === 'q' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipArray[ship].rotateLeft = true
      }
      if(data.key === 'e' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipArray[ship].rotateRight = true
      }
      // You can perform any necessary server-side logic here based on the received key.
    });
    socket.on('interact', (data) => {
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      const shipArrayPosition = gameState.playerArray[playerArrayPosition].insideShip;
      if(gameState.playerArray[playerArrayPosition].mode === 0){
        gameState.playerArray[playerArrayPosition].mode = 1
        gameState.shipArray[shipArrayPosition].controledBy = playerArrayPosition
        return
      }
      if(gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.playerArray[playerArrayPosition].mode = 0
        gameState.shipArray[shipArrayPosition].controledBy = -1
  
        return
      }
    })
  
    socket.on('stopMovement', (data) => {
      console.log('Received movement key:', data.key);
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      console.log(playerArrayPosition)
      if(playerArrayPosition === undefined){return}
      const ship = gameState.playerArray[playerArrayPosition].insideShip
      if(data.key === 'w'){
        gameState.playerArray[playerArrayPosition].moveForward = false
      }
      if(data.key === 's'){
        gameState.playerArray[playerArrayPosition].moveDown = false
      }
      if(data.key === 'a'){
        gameState.playerArray[playerArrayPosition].moveLeft = false
      }
      if(data.key === 'd'){
        gameState.playerArray[playerArrayPosition].moveRight = false
      }
      if(data.key === 'q'){
        gameState.playerArray[playerArrayPosition].rotateLeft = false
      }
      if(data.key === 'e'){
        gameState.playerArray[playerArrayPosition].rotateRight = false
      }
      if(data.key === 'w' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipArray[ship].moveForward = false
      }
      if(data.key === 'q' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipArray[ship].rotateLeft = false
      }
      if(data.key === 'e' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipArray[ship].rotateRight = false
      }
      // You can perform any necessary server-side logic here based on the received key.
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(3001, () => {
    console.log(`Server is running on port 3001`);
  });
}
