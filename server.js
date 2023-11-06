const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const cors = require("cors");
const { constrainedMemory } = require('process');
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
    playerArray: [
      // {
    //   rotation: 0,
    //   x: 5,
    //   y: 5,
    //   velocityX: 0,
    //   velocityY: 0,
    //   id: "AhzgAtklgo2FJvwWAADO",
    //   hp: 100,
    //   insideShip:0,
    //   controllingShip:0,
    //   direction: 0,
    //   insideRoomX: 3,
    //   insideRoomY: 3
    // }
  ],
    playerIDToIndex: new Map(),
    // shipArray: [
      // {
    //   id: 0,
    //   alive: true,
    //   controledBy: 0,
    //   rotation: 0,
    //   x: 0,
    //   y: 0,
    //   velocityX: 0,
    //   velocityY: 0,
    //   moveForward: false,
    //   rotationVelocity: 0,
    //   rotation: 0,
    //   shipRooms: [
    //     [0, 0, 0, 0, 0],
    //     [0, 1, 5, 4, 0],
    //     [3, 6, 1, 2, 0],
    //     [0, 1, 5, 4, 0],
    //     [0, 0, 0, 0, 0]
    //   ],
    //   playersOnShip: [0],
    //   speed: 0.1,
    //   type:"ship",
    //   roomDamage:{},
    //   weaponLocations:[{
    //         x:4,
    //         y:2
    //       },
    //       {
    //         x:4,
    //         y:4
    //       }
    //     ],
    // }
  // ],
  shipMap :{

  },
  amountOfShips:0,


    bulletArray: [
    //   {
    //   dateOfBirth: Date.now(),
    //   x: 0,
    //   y: 0,
    //   velocityX: 0,
    //   velocityY: 0,
    //   rotation: 0
    // }
  ],
  asteroidArray:[]
  };
  function createAsteroid(x, y, size, hp) {
    return {
      x,
      y,
      size,
      hp
      // Add other properties as needed
    };
  }

  gameConfig = {
    mapWidth : 1000,
    mapHeight : 1000,

    numAsteroids : 10, // Define the number of asteroids to spawn
    minAsteroidSize : 20, // Define the minimum asteroid size
    maxAsteroidSize : 50, // Define the maximum asteroid size
  }

  function spawnAsteroids() {
    for (let i = 0; i < gameConfig.numAsteroids; i++) {
      const x = Math.random() * gameConfig.mapWidth; // Random X position on map
      const y = Math.random() * gameConfig.mapHeight; // Random Y position on map
      const size = Math.floor(Math.random() * (gameConfig.maxAsteroidSize - gameConfig.minAsteroidSize + 1)) + gameConfig.minAsteroidSize; // Random size within a range

      gameState.asteroidArray.push(createAsteroid(x, y, size, 100));
    }
  }


  // Call the spawnAsteroids function when starting the server
  spawnAsteroids();

  // gameState.playerIDToIndex.set(`${gameState.playerArray[0].id}`, 0);

  let gameSpace = d3Quadtree.quadtree(gameState.shipArray, d => d.x, d => d.y);
  // gameSpace.addAll(gameState.bulletArray);
  let asteroidSpace = d3Quadtree.quadtree(gameState.asteroidArray, d => d.x, d => d.y);


  function boardShip(playerID){
    
    gameState.playerArray[playerID].mode = 0;
    const shipMapPosition = gameState.playerArray[playerID].insideShip;
    
    const cosAngle = Math.cos(gameState.shipMap[shipMapPosition].rotation);
    const sinAngle = Math.sin(gameState.shipMap[shipMapPosition].rotation);

    const adjustedX =
      gameState.shipMap[shipMapPosition].x +
      (gameState.playerArray[playerID].x - 160) * cosAngle -
      (gameState.playerArray[playerID].y - 160) * sinAngle;

    const adjustedY =
      gameState.shipMap[shipMapPosition].y +
      (gameState.playerArray[playerID].x - 160) * sinAngle +
      (gameState.playerArray[playerID].y - 160) * cosAngle;
    console.log(adjustedX+','+adjustedY)

    let nearbyShip;

    gameSpace.visit(function (node, x1, y1, x2, y2) {
      if (!node.length) {
        do {
          const otherShip = node.data;
          const distance = Math.sqrt((otherShip.x - adjustedX) ** 2 + (otherShip.y - adjustedY) ** 2);
          if (distance <= 200) {
            
            
            if (otherShip.shipId != gameState.playerArray[playerID].insideShip) {
            
              nearbyShip=gameState.shipMap[otherShip.shipId];
            }
          }
        } while (node = node.next);
      }
      // console.log(nearbyObjects)
      return x1 > adjustedX + 200 || x2 < adjustedX - 200 || y1 > adjustedY + 200 || y2 < adjustedY - 200;
    });

    if(nearbyShip){
      // console.log(nearbyShip)
      const roomHit = determineHitRoom(nearbyShip, adjustedX, adjustedY)
      console.log(roomHit)
      if(roomHit===null||roomHit.roomY>4||roomHit.roomY<0||roomHit.roomX>4||roomHit.roomX<0){return}
      if(damageAbleRooms(nearbyShip.shipRooms[roomHit.roomY][roomHit.roomX])){
        const shipPlayerIndex = gameState.shipMap[shipMapPosition].playersOnShip.indexOf(playerID)
        gameState.shipMap[shipMapPosition].playersOnShip.splice(shipPlayerIndex, 1)
        gameState.playerArray[playerID].insideShip=nearbyShip.id
        gameState.shipMap[nearbyShip.id].playersOnShip.push(playerID)
        gameState.playerArray[playerID].x = roomHit.roomX*64 + 32
        gameState.playerArray[playerID].y = roomHit.roomY*64 + 32

      }


    }

  }

  function determineHitRoom(ship, bulletX, bulletY) {
    console.log(ship)
    const rotation = ship.rotation;

    // Adjust the bullet's position relative to the ship's position
    const adjustedBulletX = bulletX - ship.x;
    const adjustedBulletY = bulletY - ship.y;

    // Adjust for ship rotation (rotate the hit point back)
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);

    // Calculate the hit point after ship rotation
    const rotatedBulletX =
        adjustedBulletX * cosRotation + adjustedBulletY * sinRotation;
    const rotatedBulletY =
        adjustedBulletY * cosRotation - adjustedBulletX * sinRotation;

    // Calculate the room coordinates based on the room size
    const roomSize = 64; // Size of each room
    const roomArray = ship.shipRooms;

    // Adjust the hit coordinates according to room size and offset
    const roomX = Math.floor((rotatedBulletX + ship.shipRooms[0].length * roomSize / 2) / roomSize);
    const roomY = Math.floor((rotatedBulletY + ship.shipRooms.length * roomSize / 2) / roomSize);

    // Check for collision with valid rooms
    if (roomArray[roomY] != undefined && damageAbleRooms(roomArray[roomY][roomX])) {
        return { roomX, roomY }; // The bullet hit a valid room
    } else {
        return null; // The bullet hit an empty space or a non-collidable room
    }
}
function addToShip(playerArrayPosition){
  const shipMapPosition = gameState.playerArray[playerArrayPosition].insideShip;
  const ship = gameState.shipMap[shipMapPosition]
  const player = gameState.playerArray[playerArrayPosition]
  if(ship.inventory.nickle >=10 && gameState.playerArray[playerArrayPosition].mode === 0){
    gameState.shipMap[shipMapPosition].inventory.nickle -= 10
  }
  if(player.buildDirection === 'right'){
    if(gameState.shipMap[shipMapPosition].shipRooms[player.insideRoomY][player.insideRoomX+1]===undefined){return}
    gameState.shipMap[shipMapPosition].shipRooms[player.insideRoomY][player.insideRoomX+1] = 1;
  }
  if(player.buildDirection === 'left'){
    if(gameState.shipMap[shipMapPosition].shipRooms[player.insideRoomY][player.insideRoomX-1]===undefined){return}

    gameState.shipMap[shipMapPosition].shipRooms[player.insideRoomY][player.insideRoomX-1] = 1;
  }
  if(player.buildDirection === 'up'){
    if(gameState.shipMap[shipMapPosition].shipRooms[player.insideRoomY-1][player.insideRoomX]===undefined){return}
    gameState.shipMap[shipMapPosition].shipRooms[player.insideRoomY-1][player.insideRoomX] = 1;
  }
  if(player.buildDirection === 'down'){
    if(gameState.shipMap[shipMapPosition].shipRooms[player.insideRoomY+1][player.insideRoomX]===undefined){return}
    gameState.shipMap[shipMapPosition].shipRooms[player.insideRoomY+1][player.insideRoomX] = 1;
  }
}

function buildPrices(slot){
  if(slot === 1){
    return {nickle: 10}
  }
}

function selectSlot(slot, playerArrayPosition){
  gameState.playerArray[playerArrayPosition].slot = slot
}

function buildShip(playerArrayPosition){
  const shipMapPosition = gameState.playerArray[playerArrayPosition].insideShip;
  const ship = gameState.shipMap[shipMapPosition]
  if(ship.inventory.nickle >=10 && gameState.playerArray[playerArrayPosition].mode === 1){
    gameState.shipMap[shipMapPosition].inventory.nickle -= 10
  }
  
  gameState.shipMap[`${gameState.amountOfShips}`] = {
    id: gameState.amountOfShips,
      alive: true,
      controledBy: -1,
      rotation:0,
      x: gameState.shipMap[shipMapPosition].x+400,
      y: gameState.shipMap[shipMapPosition].y,
      velocityX:0,
      velocityY:0,
      moveForward: false,
      rotationVelocity: 0,
      rotation: 0,
      speed:0.1,
      shipRooms: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ],
      roomDamage:{
      },
      //Forgot to start at 0 for weapon locations
      weaponLocations:[
      ],
      engineLocation:
      {
        x:-1,
        y:-1
      },
      pilotRoomLocation:
      {
        x:-1,
        y:-1
      },
      playersOnShip:[],
      inventory: {
        nickle:0
      }
  }
  gameState.amountOfShips += 1;
  
}

  function update() {
    const lastTimestamp = gameState.t;
    gameState.t = Date.now();
    const delta = (gameState.t - lastTimestamp) / 16;
    
    const shipArray = Object.values(gameState.shipMap).map(ship => ({ x: ship.x, y: ship.y, shipId: ship.id }));
    gameSpace = d3Quadtree.quadtree(shipArray, d => d.x, d => d.y);


    // gameSpace.addAll(gameState.bulletArray);




    for (let i = 0; i < gameState.playerArray.length; i++) {
      
      let player = gameState.playerArray[i];
      if(player.insideShip === undefined){
        io.to(player.id).emit("gameState", gameState);
        continue
      }
      let ship = gameState.shipMap[player.insideShip];


      const roomSize = 64;
      let roomType = 0;
      roomType = ship.shipRooms[player.insideRoomY][player.insideRoomX];
      if(ship.roomDamage[`${player.insideRoomX+','+player.insideRoomY}`]!=undefined &&ship.roomDamage[`${player.insideRoomX+','+player.insideRoomY}`].onFire<=0 ){
        ship.roomDamage[`${player.insideRoomX+','+player.insideRoomY}`].health += 0.5*delta
        if(ship.roomDamage[`${player.insideRoomX+','+player.insideRoomY}`].health>=100){
          delete ship.roomDamage[`${player.insideRoomX+','+player.insideRoomY}`]
        }
      }

      // Store initial player position
      const beforePlayerX = player.x;
      const beforePlayerY = player.y;


      let newRoomPlayerX = player.x % 64 - 32
      let newRoomPlayerY = player.y % 64 - 32


      if (player.moveForward === true && player.moveDown === false && player.moveLeft === false && player.moveRight === false) {
        player.y = (player.y - 1 * delta);
        newRoomPlayerY = newRoomPlayerY - 1 * delta
      }
      if (player.moveDown === true && player.moveForward === false && player.moveLeft === false && player.moveRight === false) {
        player.y = (player.y + 1 * delta);
        newRoomPlayerY = newRoomPlayerY + 1 * delta
      }
      if (player.moveLeft === true && player.moveDown === false && player.moveForward === false && player.moveRight === false) {
        player.x = (player.x - 1 * delta);
        newRoomPlayerX = (newRoomPlayerX - 1 * delta);
      }
      if (player.moveRight === true && player.moveDown === false && player.moveLeft === false && player.moveForward === false) {
        player.x = (player.x + 1 * delta);
        newRoomPlayerX = (newRoomPlayerX + 1 * delta);
      }
      if (player.moveForward === true && player.moveDown === false && player.moveLeft === true && player.moveRight === false) {
        player.y = (player.y - 0.5 * delta);
        player.x = (player.x - 0.5 * delta);
        newRoomPlayerX = (newRoomPlayerX - 0.5 * delta);
        newRoomPlayerY = newRoomPlayerY - 0.5 * delta

      }
      if (player.moveForward === true && player.moveDown === false && player.moveLeft === false && player.moveRight === true) {
        player.y = (player.y - 0.5 * delta);
        player.x = (player.x + 0.5 * delta);
        newRoomPlayerX = (newRoomPlayerX + 0.5 * delta);
        newRoomPlayerY = newRoomPlayerY - 0.5 * delta


      }
      if (player.moveDown === true && player.moveForward === false && player.moveLeft === true && player.moveRight === false) {
        player.y = (player.y + 0.5 * delta);
        player.x = (player.x - 0.5 * delta);
        newRoomPlayerX = (newRoomPlayerX - 0.5 * delta);
        newRoomPlayerY = newRoomPlayerY + 0.5 * delta


      }
      if (player.moveDown === true && player.moveForward === false && player.moveLeft === false && player.moveRight === true) {
        player.y = (player.y + 0.5 * delta);
        player.x = (player.x + 0.5 * delta);
        newRoomPlayerX = (newRoomPlayerX + 0.5 * delta);
        newRoomPlayerY = newRoomPlayerY + 0.5 * delta


      }

      

      if (roomType === 1 || roomType === 5 || roomType === 6 || roomType === 7) {
        // Define the gap dimensions
        const gapWidthX = 6; // Assuming the gap in X-axis is 6 units wide
        const gapWidthY = 6; 
    
        // Check for collisions in the X-axis, allowing movement through the gap
        if ((newRoomPlayerX < -32 || newRoomPlayerX > 32) && !(newRoomPlayerY > -gapWidthY && newRoomPlayerY < gapWidthY)) {
            player.x = beforePlayerX; // Revert X position
            newRoomPlayerX = beforePlayerX
        }
    
        // Check for collisions in the Y-axis
        if ((newRoomPlayerY < -32 || newRoomPlayerY > 32) && !(newRoomPlayerX > -gapWidthX && newRoomPlayerX < gapWidthX)) {
            player.y = beforePlayerY; // Revert Y position
            newRoomPlayerY = beforePlayerY
        }

        

        const roomX = Math.floor((player.x+32 + (ship.shipRooms[0].length * roomSize) / 2) / roomSize)-3;
        const roomY = Math.floor((player.y+32 + (ship.shipRooms.length * roomSize) / 2) / roomSize)-3;
        if(!(roomX<0 || roomX>4 || roomY<0 || roomY>4)){
          const enteringRoom = ship.shipRooms[roomY][roomX];
          if(enteringRoom === 0 || enteringRoom === 4 || enteringRoom === 3){
            player.x = beforePlayerX; // Revert X position
            player.y = beforePlayerY; // Revert Y position
          } else {
            player.insideRoomX = roomX;
            player.insideRoomY = roomY;

          }
        } else{
            player.x = beforePlayerX; // Revert X position
            player.y = beforePlayerY;
        }

    }

    if (roomType === 2) {


      const gapWidthX = 6; // Assuming the gap in X-axis is 6 units wide
      const gapWidthY = 6; 
  
      // Check for collisions in the X-axis, allowing movement through the gap
      if ((newRoomPlayerX < -32 || newRoomPlayerX > 32) && !(newRoomPlayerY > -gapWidthY && newRoomPlayerY < gapWidthY)) {
          player.x = beforePlayerX; // Revert X position
          newRoomPlayerX = beforePlayerX
      }
  
      // Check for collisions in the Y-axis
      if ((newRoomPlayerY < -32 || newRoomPlayerY > 32) && !(newRoomPlayerX > -gapWidthX && newRoomPlayerX < gapWidthX)) {
          player.y = beforePlayerY; // Revert Y position
          newRoomPlayerY = beforePlayerY
      }



      const roomX = Math.floor((player.x+32 + (ship.shipRooms[0].length * roomSize) / 2) / roomSize)-3;
      const roomY = Math.floor((player.y+32 + (ship.shipRooms.length * roomSize) / 2) / roomSize)-3;
      if(!(roomX<0 || roomX>4 || roomY<0 || roomY>4)){
        const enteringRoom = ship.shipRooms[roomY][roomX];
        if(enteringRoom === 0 || enteringRoom === 4 || enteringRoom === 3){
          player.x = beforePlayerX; // Revert X position
          player.y = beforePlayerY; // Revert Y position
        } else {
          player.insideRoomX = roomX;
          player.insideRoomY = roomY;

        }
      } else{
        player.x = beforePlayerX; // Revert X position
        player.y = beforePlayerY;
      }
      
    }

      // Calculate position based on the ship the player is inside
      const referenceX = ship.x;
      const referenceY = ship.y;
      const nearbyObjectMap = {};
      gameSpace.visit(function (node, x1, y1, x2, y2) {
        if (!node.length) {
          do {
            const otherShip = node.data;
            const distance = Math.sqrt((otherShip.x - referenceX) ** 2 + (otherShip.y - referenceY) ** 2);
            if (distance <= 1500) {
              
              
              if (gameState.shipMap.hasOwnProperty(`${otherShip.shipId}`)) {
              
                nearbyObjectMap[otherShip.shipId]=gameState.shipMap[otherShip.shipId];
              }
            }
          } while (node = node.next);
        }
        // console.log(nearbyObjects)
        return x1 > referenceX + 1500 || x2 < referenceX - 1500 || y1 > referenceY + 1500 || y2 < referenceY - 1500;
      });

      const nearbyAsteroidArray= []
      asteroidSpace.visit(function (node, x1, y1, x2, y2) {
        if (!node.length) {
          do {
            const otherAsteroid = node.data;
            const distance = Math.sqrt((otherAsteroid.x - referenceX) ** 2 + (otherAsteroid.y - referenceY) ** 2);
            if (distance <= 1500) {
              
              nearbyAsteroidArray.push(otherAsteroid)
              
            }
          } while (node = node.next);
        }
        // console.log(nearbyObjects)
        return x1 > referenceX + 1500 || x2 < referenceX - 1500 || y1 > referenceY + 1500 || y2 < referenceY - 1500;
      });



      // console.log(nearbyObjectMap)

      const gameStateForPlayer = {
        t: gameState.t,
        playerArray: gameState.playerArray,
        shipMap: nearbyObjectMap,
        playerIDToIndex: gameState.playerIDToIndex,
        bulletArray: gameState.bulletArray,
        asteroidArray: nearbyAsteroidArray
      };
      //Forgot to do this, Need to fix it somehow
      //playerArray[i].insideShip and shipMap decouple on the client side here
      io.to(player.id).emit("gameState", gameStateForPlayer);
    }
//////
    for (let i = gameState.bulletArray.length-1; i >= 0; i--) {
      // gameSpace.remove(gameState.bulletArray[i]);
      if(Date.now() - gameState.bulletArray[i].dateOfBirth > 1000){
        gameState.bulletArray.splice(i, 1)
        continue  
      }
      gameState.bulletArray[i].x += (gameState.bulletArray[i].velocityX * delta);
      gameState.bulletArray[i].y += (gameState.bulletArray[i].velocityY * delta);

      const nearbyShips = [];
      gameSpace.visit(function(node, x1, y1, x2, y2) {
        if (!node.length) {
          do {
            const otherShip = node.data;
            const distance = Math.sqrt((otherShip.x - gameState.bulletArray[i].x) ** 2 + (otherShip.y - gameState.bulletArray[i].y) ** 2);
            if (distance < 64*5/1.5+8 && otherShip !== gameState.bulletArray[i]) {
              nearbyShips.push(gameState.shipMap[otherShip.shipId]);
            }
          } while (node = node.next);
        }
        return x1 > gameState.bulletArray[i].x + 64*5/1.5+8 || x2 < gameState.bulletArray[i].x - 64*5/1.5+8 || y1 > gameState.bulletArray[i].y + 64*5/1.5+8 || y2 < gameState.bulletArray[i].y - 64*5/1.5+8;
      });
      const nearbyAsteroids = []
      const bulletX = gameState.bulletArray[i].x
      const bulletY = gameState.bulletArray[i].y
      
      asteroidSpace.visit(function(node, x1, y1, x2, y2) {
        if (!node.length) {
          do {
            const asteroid = node.data;
            const distance = Math.sqrt((asteroid.x - bulletX) ** 2 + (asteroid.y - bulletY) ** 2);
            if (distance < 20 && asteroid !== gameState.bulletArray[i]) {
              nearbyAsteroids.push(asteroid);

              gameState.bulletArray.splice(i, 1)
            }
          } while (node = node.next);
        }
        return x1 > bulletX + 20 || x2 < bulletX - 20 || y1 > bulletY + 20 || y2 < bulletY - 20;
      });

      nearbyAsteroids.forEach(asteroid => {
        const index = gameState.asteroidArray.indexOf(asteroid); 
        gameState.asteroidArray[index].hp -= 10
        if(gameState.asteroidArray[index].hp<=0){
          gameState.asteroidArray.splice(index, 1)
        }
        asteroidSpace = d3Quadtree.quadtree(gameState.asteroidArray, d => d.x, d => d.y);
      })


      nearbyShips.forEach(otherShip => {
        //element not in bullets to filter them
      
        if(otherShip.speed === undefined || gameState.bulletArray[i]===undefined){return}
        const distance = Math.sqrt((otherShip.x - gameState.bulletArray[i].x) ** 2 + (otherShip.y - gameState.bulletArray[i].y) ** 2);
        if (distance < 64*5/1.5+8) {
          
          
          const hitRoom = determineHitRoom(otherShip, gameState.bulletArray[i].x, gameState.bulletArray[i].y);
          
          if (hitRoom) {
              const roomType =gameState.shipMap[otherShip.id].shipRooms[hitRoom.roomY][hitRoom.roomX]
              console.log(`The bullet hit room at (${hitRoom.roomX}, ${hitRoom.roomY}).`);
              if(gameState.shipMap[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`] === undefined){
                gameState.shipMap[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`]={health:100, onFire : 0, x:hitRoom.roomX, y:hitRoom.roomY, roomType: roomType}
              } 

              if(Math.random()<0.5 && gameState.shipMap[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].onFire < 100){
                gameState.shipMap[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].onFire += 10;
                if(gameState.shipMap[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].onFire > 100){
                  gameState.shipMap[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].onFire = 100
                  
                }
              }
              gameState.shipMap[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].health -= 10;
              if(gameState.shipMap[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].health <= 0){
                destroyRoom(hitRoom.roomX, hitRoom.roomY, otherShip.id)
              }
              
              

              gameState.bulletArray.splice(i, 1)

          } else {
              console.log("The bullet hit an empty space or a non-collidable room.");
          }
          // Perform collision handling here...
          // for (let y = 0; y < gameState.shipMap[i].shipRooms.length; y++){
          //   for (let x = 0; x < gameState.shipMap[i].shipRooms[y].length; x++){
          //     const room = gameState.shipMap[i].shipRooms[y][x]
          //   }

          // }
        }
      })


    }

    for (let i = 0; i < gameState.amountOfShips; i++) {
      // Remove ship from quadtree before position update
    gameSpace.remove(gameState.shipMap[i]);
    const engineLocation = gameState.shipMap[i].engineLocation;
      if(engineLocation.x != -1 && (gameState.shipMap[i].roomDamage[`${(engineLocation.x+1)+','+(engineLocation.y)}`] === undefined || gameState.shipMap[i].roomDamage[`${(engineLocation.x+1)+','+(engineLocation.y)}`].health>70) ){
        
        if (gameState.shipMap[i].rotateLeft === true) {
          gameState.shipMap[i].rotationVelocity = (gameState.shipMap[i].rotationVelocity - 0.01 * delta * gameState.shipMap[i].speed);
        }
        if (gameState.shipMap[i].rotateRight === true) {
          gameState.shipMap[i].rotationVelocity = (gameState.shipMap[i].rotationVelocity + 0.01 * delta * gameState.shipMap[i].speed);
        }
        if (gameState.shipMap[i].moveForward === true) {
          
          const angleInRadians = gameState.shipMap[i].rotation;
          gameState.shipMap[i].velocityX += Math.cos(angleInRadians) * 1 * delta * gameState.shipMap[i].speed;
          gameState.shipMap[i].velocityY += Math.sin(angleInRadians) * 1 * delta * gameState.shipMap[i].speed;
        }
      }

      
      gameState.shipMap[i].rotation += (gameState.shipMap[i].rotationVelocity * delta);

      gameState.shipMap[i].x += (gameState.shipMap[i].velocityX * delta);
      gameState.shipMap[i].y += (gameState.shipMap[i].velocityY * delta);

      for (let roomXY in gameState.shipMap[i].roomDamage) {
        const roomX = gameState.shipMap[i].roomDamage[roomXY].x
        const roomY = gameState.shipMap[i].roomDamage[roomXY].y

        if(gameState.shipMap[i].roomDamage[roomXY].onFire > 0){
          gameState.shipMap[i].roomDamage[roomXY].onFire += (0.1 * delta)
          for(let p = 0; p < gameState.shipMap[i].playersOnShip.length; p++){
            
            const playerID = gameState.shipMap[i].playersOnShip[p]
            const player = gameState.playerArray[playerID]
            if(player.insideRoomX === roomX && player.insideRoomY === roomY){
              gameState.shipMap[i].roomDamage[roomXY].onFire -= (0.3 * delta)
              gameState.playerArray[playerID].hp -= (0.2*delta)
              checkPlayerHealth(playerID)
            }
          }
          if(gameState.shipMap[i].roomDamage[roomXY].onFire >= 100){
            gameState.shipMap[i].roomDamage[roomXY].onFire = 100;
            fireSpread(gameState.shipMap[i].roomDamage[roomXY].x, gameState.shipMap[i].roomDamage[roomXY].y, i, delta)
            gameState.shipMap[i].roomDamage[roomXY].health -= 0.05
            if(gameState.shipMap[i].roomDamage[roomXY].health<=0){
              destroyRoom(gameState.shipMap[i].roomDamage[roomXY].x, gameState.shipMap[i].roomDamage[roomXY].y, i)
            }

          }
        }
      }


      // Perform collision logic...

      let nearbyAsteroid = undefined;
      asteroidSpace.visit(function(node, x1, y1, x2, y2) {
        if (!node.length) {
          do {
            const asteroid = node.data;
            const distance = Math.sqrt((asteroid.x - gameState.shipMap[i].x) ** 2 + (asteroid.y - gameState.shipMap[i].y) ** 2);
            if (distance < 64 && asteroid !== gameState.shipMap[i] && asteroid.type != 1) {
              nearbyAsteroid = asteroid;
              

            }
          } while (node = node.next);
        }
        return x1 > gameState.shipMap[i].x + 64 || x2 < gameState.shipMap[i].x - 64 || y1 > gameState.shipMap[i].y + 64 || y2 < gameState.shipMap[i].y - 64;
      });

      if(nearbyAsteroid){
        gameState.shipMap[i].velocityX = -gameState.shipMap[i].velocityX/2
        gameState.shipMap[i].velocityY = -gameState.shipMap[i].velocityY/2
        gameState.shipMap[i].x+=gameState.shipMap[i].velocityX*3
        gameState.shipMap[i].y+=gameState.shipMap[i].velocityY*3
        const randomPoint = randomPointIn2DArray() 
        dealDamage(i,randomPoint[0],randomPoint[1],20 )
        const index = gameState.asteroidArray.indexOf(nearbyAsteroid); 
        gameState.asteroidArray[index].hp -= 25
        
        if(gameState.asteroidArray[index].hp<=0){
          gameState.asteroidArray.splice(index, 1)
          gameState.shipMap[i].inventory.nickle += Math.floor(Math.random() * 10)
          console.log(gameState.shipMap[i].inventory)
        }
        asteroidSpace = d3Quadtree.quadtree(gameState.asteroidArray, d => d.x, d => d.y);
      }

      // nearbyShips.forEach(otherShip => {
      //   const distance = Math.sqrt((otherShip.x - gameState.shipMap[i].x) ** 2 + (otherShip.y - gameState.shipMap[i].y) ** 2);
      //   if (distance < 64*5) {

      //     // Perform collision handling here...
      //     for (let y = 0; y < gameState.shipMap[i].shipRooms.length; y++){
      //       for (let x = 0; x < gameState.shipMap[i].shipRooms[y].length; x++){
      //         const room = gameState.shipMap[i].shipRooms[y][x]
      //       }

      //     }
      //   }
      // })
      

    }
  }
  function dealDamage(shipId, roomX, roomY, amount){
    if(damageAbleRooms(gameState.shipMap[shipId].shipRooms[roomY][roomX])){
      if(gameState.shipMap[shipId].roomDamage[`${roomX},${roomY}`] === undefined){
        gameState.shipMap[shipId].roomDamage[`${roomX+','+roomY}`]={health:100, onFire : 0, x:roomX, y:roomY, roomType: gameState.shipMap[shipId].shipRooms[roomY][roomX]}
      }
      gameState.shipMap[shipId].roomDamage[`${roomX},${roomY}`].health -= amount
      if(gameState.shipMap[shipId].roomDamage[`${roomX},${roomY}`].health <=0){
        destroyRoom(roomX, roomY, shipId)
      }
    }
  }

  function randomPointIn2DArray() {
    const rows = 5;
    const cols = 5;
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);
    return [randomRow, randomCol];
  }

  function checkPlayerHealth(playerID){
    if(gameState.playerArray[playerID].hp<= 0){
      const shipIdDiedIn = gameState.playerArray[playerID].insideShip
      gameState.playerArray[playerID].x = 64*5/2
      gameState.playerArray[playerID].y = 64*5/2

      gameState.playerArray[playerID].insideShip = 0
      gameState.playerArray[playerID].insideRoomX = 2
      gameState.playerArray[playerID].insideRoomY = 2
      gameState.playerArray[playerID].hp = 100
      

      gameState.shipMap[shipIdDiedIn].playersOnShip = gameState.shipMap[shipIdDiedIn].playersOnShip.filter(players => players !== playerID);
      gameState.shipMap[0].playersOnShip.push(playerID)

    }
  }

  function destroyRoom(x, y, shipId){
    gameState.shipMap[shipId].shipRooms[y][x] = 0;
    delete gameState.shipMap[shipId].roomDamage[`${x+','+y}`];

  }

  function damageAbleRooms(room){
    if(room===1||room===2||room===5||room===6||room===7){
      return true
    }
  }

  function fireSpread(x, y, shipId, delta){
    let roomCheckX = 1
    let roomCheckY = 0
    if(damageAbleRooms(gameState.shipMap[shipId].shipRooms[y+roomCheckY][x+roomCheckX])){
      if(gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]===undefined){
        gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]={health:100, onFire : 0, x:x+roomCheckX, y:y+roomCheckY, roomType:gameState.shipMap[shipId].shipRooms[y+roomCheckY][x+roomCheckX]}
      }
      gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`].onFire += 0.05*delta

    }
    roomCheckX = -1
    if(damageAbleRooms(gameState.shipMap[shipId].shipRooms[y+roomCheckY][x+roomCheckX])){
      if(gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]===undefined){
        gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]={health:100, onFire : 0, x:x+roomCheckX, y:y+roomCheckY, roomType:gameState.shipMap[shipId].shipRooms[y+roomCheckY][x+roomCheckX]}
      }
      gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`].onFire += 0.05*delta

    }
    roomCheckX = 0
    roomCheckY = 1
    if(damageAbleRooms(gameState.shipMap[shipId].shipRooms[y+roomCheckY][x+roomCheckX])){
      if(gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]===undefined){
        gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]={health:100, onFire : 0, x:x+roomCheckX, y:y+roomCheckY, roomType:gameState.shipMap[shipId].shipRooms[y+roomCheckY][x+roomCheckX]}
      }
      gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`].onFire += 0.05*delta

    }
    roomCheckY = -1
    if(damageAbleRooms(gameState.shipMap[shipId].shipRooms[y+roomCheckY][x+roomCheckX])){
      if(gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]===undefined){
        gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]={health:100, onFire : 0, x:x+roomCheckX, y:y+roomCheckY, roomType:gameState.shipMap[shipId].shipRooms[y+roomCheckY][x+roomCheckX]}
      }
      gameState.shipMap[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`].onFire += 0.05*delta

    }
  }

  gameState.interval = setInterval(update, 1000 / 60);

  io.on('connection', (socket) => {
    console.log('A user connected');
    gameState.playerArray.push({
      x: 64*5/2,
      y: 64*5/2,
      spaceX : 0,
      spaceY : 0,
      mode: 1,
      velocityX: 0,
      velocityY: 0,
      moveRight: false,
      moveLeft: false,
      moveForward: false,
      moveDown: false,
      rotationVelocity: 0,
      rotation: 0,
      insideShip:gameState.amountOfShips,
      controllingShip:gameState.amountOfShips,
      direction: 0,
      id: socket.id,
      hp: 100,
      insideRoomX:2,
      insideRoomY:2,
      buildDirection:'right',
      slot:1
      
    })
    
    gameState.shipMap[`${gameState.amountOfShips}`] = {
      id: gameState.amountOfShips,
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
        shipRooms: [
          [0, 0, 0, 0, 0],
          [0, 5, 4, 0, 0],
          [1, 1, 1, 7, 0],
          [3, 6, 5, 4, 0],
          [0, 0, 0, 0, 0]
        ],
        roomDamage:{
        },
        //Forgot to start at 0 for weapon locations
        weaponLocations:[{
            x:3,
            y:2
          },
          {
            x:4,
            y:4
          }
        ],
        engineLocation:
        {
          x:0,
          y:3
        },
        pilotRoomLocation:
        {
          x:3,
          y:2
        },
        playersOnShip:[gameState.playerArray.length-1],
        inventory: {
          nickle:0
        }
    }
    gameState.amountOfShips += 1;
    // gameState.shipMap.push({
    //     id: gameState.shipMap.length,
    //     alive: true,
    //     controledBy: gameState.playerArray.length-1,
    //     rotation:0,
    //     x: 0,
    //     y: 0,
    //     velocityX:0,
    //     velocityY:0,
    //     moveForward: false,
    //     rotationVelocity: 0,
    //     rotation: 0,
    //     speed:0.1,
    //     shipRooms: [
    //       [0, 0, 0, 0, 0],
    //       [0, 5, 4, 0, 0],
    //       [1, 1, 1, 7, 0],
    //       [3, 6, 5, 4, 0],
    //       [0, 0, 0, 0, 0]
    //     ],
    //     roomDamage:{
    //     },
    //     //Forgot to start at 0 for weapon locations
    //     weaponLocations:[{
    //         x:3,
    //         y:2
    //       },
    //       {
    //         x:4,
    //         y:4
    //       }
    //     ],
    //     engineLocation:
    //     {
    //       x:0,
    //       y:3
    //     },
    //     pilotRoomLocation:
    //     {
    //       x:3,
    //       y:2
    //     },
    //     playersOnShip:[gameState.playerArray.length-1]
      
    // })

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
        gameState.shipMap[ship].moveForward = true
      }
      if(data.key === 'q' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipMap[ship].rotateLeft = true
      }
      if(data.key === 'e' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipMap[ship].rotateRight = true
      }
      // You can perform any necessary server-side logic here based on the received key.
    });
    socket.on('interact', (data) => {
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      const shipMapPosition = gameState.playerArray[playerArrayPosition].insideShip;
      const currentRoomX = gameState.playerArray[playerArrayPosition].insideRoomX
      const currentRoomY = gameState.playerArray[playerArrayPosition].insideRoomY
      if(gameState.playerArray[playerArrayPosition].mode === 0){
        if(currentRoomX===gameState.shipMap[shipMapPosition].pilotRoomLocation.x && currentRoomY===gameState.shipMap[shipMapPosition].pilotRoomLocation.y && (gameState.shipMap[shipMapPosition].roomDamage[`${(currentRoomX)+','+(currentRoomY)}`]===undefined || gameState.shipMap[shipMapPosition].roomDamage[`${(currentRoomX)+','+(currentRoomY)}`]>70)){
          gameState.playerArray[playerArrayPosition].mode = 1
          gameState.shipMap[shipMapPosition].controledBy = playerArrayPosition
        }
        
        return
      }
      if(gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.playerArray[playerArrayPosition].mode = 0
        gameState.shipMap[shipMapPosition].controledBy = -1
  
        return
      }
    })
    socket.on('eject', (data) => {
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      const shipMapPosition = gameState.playerArray[playerArrayPosition].insideShip;
      boardShip(playerArrayPosition)
      // if(gameState.playerArray[playerArrayPosition].mode === 0){
        
      //   gameState.playerArray[playerArrayPosition].spaceX=gameState.playerArray[playerArrayPosition].x + gameState.shipMap[shipMapPosition].x
      //   gameState.playerArray[playerArrayPosition].spaceY=gameState.playerArray[playerArrayPosition].y + gameState.shipMap[shipMapPosition].y
      //   gameState.playerArray[playerArrayPosition].insideShip = undefined
      // }
    })
    socket.on('slot',(data)=>{
      selectSlot(data.key)
    })
    socket.on('build', (data) => {
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      const shipMapPosition = gameState.playerArray[playerArrayPosition].insideShip;
      if(gameState.playerArray[playerArrayPosition].mode === 1){
        buildShip(playerArrayPosition)
        return
      }
      if(gameState.playerArray[playerArrayPosition].mode === 0){
        addToShip(playerArrayPosition)
        return
      }
      
      // if(gameState.playerArray[playerArrayPosition].mode === 0){
        
      //   gameState.playerArray[playerArrayPosition].spaceX=gameState.playerArray[playerArrayPosition].x + gameState.shipMap[shipMapPosition].x
      //   gameState.playerArray[playerArrayPosition].spaceY=gameState.playerArray[playerArrayPosition].y + gameState.shipMap[shipMapPosition].y
      //   gameState.playerArray[playerArrayPosition].insideShip = undefined
      // }
    })
    socket.on('buildDirection', (data) => {
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      if(data.key === 'k'){
        gameState.playerArray[playerArrayPosition].buildDirection = "up"
      }
      if(data.key === '.'){
        gameState.playerArray[playerArrayPosition].buildDirection = "right"
      }
      if(data.key === ','){
        gameState.playerArray[playerArrayPosition].buildDirection = "down"
      }
      if(data.key === 'm'){
        gameState.playerArray[playerArrayPosition].buildDirection = "left"
      }

    })
    socket.on('shoot', (data) => {
      console.log("shoot")
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      const shipMapPosition = gameState.playerArray[playerArrayPosition].insideShip;
      if(gameState.playerArray[playerArrayPosition].mode === 0){
        return
      }
      if(gameState.playerArray[playerArrayPosition].mode === 1){

    
      for(let i = 0; i <gameState.shipMap[shipMapPosition].weaponLocations.length; i++){

        const weaponLocation = gameState.shipMap[shipMapPosition].weaponLocations[i];
        if(gameState.shipMap[shipMapPosition].roomDamage[`${(weaponLocation.x-2)+','+(weaponLocation.y-1)}`] != undefined &&gameState.shipMap[shipMapPosition].roomDamage[`${(weaponLocation.x-2)+','+(weaponLocation.y-1)}`].health<70 ){
          continue
        }
        // Calculate the adjusted coordinates based on ship rotation
        const cosAngle = Math.cos(gameState.shipMap[shipMapPosition].rotation);
        const sinAngle = Math.sin(gameState.shipMap[shipMapPosition].rotation);

        const adjustedX =
          gameState.shipMap[shipMapPosition].x +
          (weaponLocation.x - 3) * 64 * cosAngle -
          (weaponLocation.y - 3) * 64 * sinAngle;

        const adjustedY =
          gameState.shipMap[shipMapPosition].y +
          (weaponLocation.x - 3) * 64 * sinAngle +
          (weaponLocation.y - 3) * 64 * cosAngle;

              // Calculate initial velocities based on ship's direction and current velocity
        const bulletSpeed = 10; // You can adjust this value to set the initial bullet speed

        const shipVelocityX = gameState.shipMap[shipMapPosition].velocityX;
        const shipVelocityY = gameState.shipMap[shipMapPosition].velocityY;

        const bulletVelocityX = bulletSpeed * cosAngle + shipVelocityX;
        const bulletVelocityY = bulletSpeed * sinAngle + shipVelocityY;

        const newBullet = {
          dateOfBirth: Date.now(),
          x: adjustedX,
          y: adjustedY,
          velocityX: bulletVelocityX,
          velocityY: bulletVelocityY,
          rotation: gameState.shipMap[shipMapPosition].rotation,
          type: 1,
      };
        gameState.bulletArray.push(newBullet)
        
        // gameSpace.add(newBullet); 

      }
         
        
        return
      }
    })
  
    socket.on('stopMovement', (data) => {
      console.log('Received movement key:', data.key);
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
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
        gameState.shipMap[ship].moveForward = false
      }
      if(data.key === 'q' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipMap[ship].rotateLeft = false
      }
      if(data.key === 'e' && gameState.playerArray[playerArrayPosition].mode === 1){
        gameState.shipMap[ship].rotateRight = false
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
