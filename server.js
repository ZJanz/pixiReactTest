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
    rotation:0,
    x: 5,
    y: 5,
    velocityX:0,
    velocityY:0,
    id: "AhzgAtklgo2FJvwWAADO",
    hp: 100
  }],
    playerIDToIndex:new Map(),
  shipArray:[{
    alive: true,
    controledBy: undefined,
    rotation:0,
    x: 0,
    y: 0,
    velocityX:0,
    velocityY:0,
    shipRooms:[
      [0,1,1,1,0],
      [0,3,1,1,0],
      [0,3,1,1,2],
      [0,3,1,1,0],
      [0,1,1,1,0]
  ]
  }]
}
gameState.playerIDToIndex.set(`${gameState.playerArray[0].id}`, 0)


function update(){
  const lastTimestamp = gameState.t
  gameState.t = Date.now()
  const delta = (gameState.t - lastTimestamp) /16;

  for(i=0; i<gameState.playerArray.length; i++){
    let player = gameState.playerArray[i]
    if(player.rotateLeft === true){
      player.rotationVelocity = (player.rotationVelocity - 0.01*delta)
    }
    if(player.rotateRight === true){
      player.rotationVelocity = (player.rotationVelocity + 0.01*delta)
    }
    if (player.moveForward === true && player.moveDown === false && player.moveLeft === false && player.moveRight === false) {
      // player.velocityY = (player.velocityY - 1 * delta);

      const angleInRadians = player.rotation; 
      player.velocityX += Math.cos(angleInRadians) * 1*delta;
      player.velocityY += Math.sin(angleInRadians) * 1*delta;
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

    player.rotation += (player.rotationVelocity * delta)

    player.x +=(player.velocityX * delta);
    player.y += (player.velocityY * delta);
    
    //Need to omit ids from gamestate possibly
    io.to(gameState.playerArray[i].id).emit("gameState", gameState)
  }

  for(i=0; i<gameState.shipArray.length; i++){
    let ship = gameState.shipArray[i]
    if(ship.rotateLeft === true){
      ship.rotationVelocity = (ship.rotationVelocity - 0.01*delta)
    }
    if(ship.rotateRight === true){
      ship.rotationVelocity = (ship.rotationVelocity + 0.01*delta)
    }
    if (ship.moveForward === true ) {
      // player.velocityY = (player.velocityY - 1 * delta);

      const angleInRadians = ship.rotation; 
      ship.velocityX += Math.cos(angleInRadians) * 1*delta;
      ship.velocityY += Math.sin(angleInRadians) * 1*delta;
    }
    

    ship.rotation += (ship.rotationVelocity * delta)

    ship.x +=(ship.velocityX * delta);
    ship.y += (ship.velocityY * delta);
    
  }
}

gameState.interval = setInterval(update, 1000/60);

io.on('connection', (socket) => {
  console.log('A user connected');
  gameState.playerArray.push({
    x: 64*3,
    y: 64*3,
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
      controledBy: gameState.playerArray,
      rotation:0,
      x: 0,
      y: 0,
      velocityX:0,
      velocityY:0,
      moveForward: false,
      rotationVelocity: 0,
      rotation: 0,
      shipRooms:[
        [0,0,0,0,0],
        [0,0,1,0,0],
        [3,1,1,1,2],
        [0,0,1,0,0],
        [0,0,0,0,0]
    ]
  })
  const index = gameState.playerArray.length-1
  gameState.playerIDToIndex.set(`${gameState.playerArray[index].id}`, index)

  console.log(gameState.playerArray)
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
    if(data.key === 'q' && gameState.playerArray[playerArrayPosition].mode === 0){
      gameState.playerArray[playerArrayPosition].rotateLeft = true
    }
    if(data.key === 'e' && gameState.playerArray[playerArrayPosition].mode === 0){
      gameState.playerArray[playerArrayPosition].rotateRight = true
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

const PORT = process.env.PORT || 3001; // Use the port you prefer
server.listen(3001, () => {
  console.log(`Server is running on port 3001`);
});