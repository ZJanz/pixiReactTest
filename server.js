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
    shipArray: [
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
  ],
    bulletArray: [
    //   {
    //   dateOfBirth: Date.now(),
    //   x: 0,
    //   y: 0,
    //   velocityX: 0,
    //   velocityY: 0,
    //   rotation: 0
    // }
  ]
  };
  // gameState.playerIDToIndex.set(`${gameState.playerArray[0].id}`, 0);

  let gameSpace = d3Quadtree.quadtree(gameState.shipArray, d => d.x, d => d.y);
  gameSpace.addAll(gameState.bulletArray);

  function determineHitRoom(ship, bulletX, bulletY) {
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


  function update() {
    const lastTimestamp = gameState.t;
    gameState.t = Date.now();
    const delta = (gameState.t - lastTimestamp) / 16;
    

    gameSpace = d3Quadtree.quadtree(gameState.shipArray, d => d.x, d => d.y);

    gameSpace.addAll(gameState.bulletArray);



    for (let i = 0; i < gameState.playerArray.length; i++) {
      let player = gameState.playerArray[i];
      let ship = gameState.shipArray[player.insideShip];
      


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
      const nearbyObjects = [];
      gameSpace.visit(function (node, x1, y1, x2, y2) {
        if (!node.length) {
          do {
            const otherShip = node.data;
            const distance = Math.sqrt((otherShip.x - referenceX) ** 2 + (otherShip.y - referenceY) ** 2);
            if (distance <= 2000) {
              nearbyObjects.push(otherShip);
            }
          } while (node = node.next);
        }
        return x1 > referenceX + 2000 || x2 < referenceX - 2000 || y1 > referenceY + 2000 || y2 < referenceY - 2000;
      });

      const gameStateForPlayer = {
        t: gameState.t,
        playerArray: [gameState.playerArray],
        shipArray: nearbyObjects,
        playerIDToIndex: gameState.playerIDToIndex,
        bulletArray: gameState.bulletArray
      };

      io.to(player.id).emit("gameState", gameState);
    }
//////
    for (let i = gameState.bulletArray.length-1; i >= 0; i--) {
      gameSpace.remove(gameState.bulletArray[i]);
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
              nearbyShips.push(otherShip);
            }
          } while (node = node.next);
        }
        return x1 > gameState.bulletArray[i].x + 64*5/1.5+8 || x2 < gameState.bulletArray[i].x - 64*5/1.5+8 || y1 > gameState.bulletArray[i].y + 64*5/1.5+8 || y2 < gameState.bulletArray[i].y - 64*5/1.5+8;
      });

      nearbyShips.forEach(otherShip => {
        //element not in bullets to filter them
      
        if(otherShip.speed === undefined || gameState.bulletArray[i]===undefined){return}
        const distance = Math.sqrt((otherShip.x - gameState.bulletArray[i].x) ** 2 + (otherShip.y - gameState.bulletArray[i].y) ** 2);
        if (distance < 64*5/1.5+8) {
          
          
          const hitRoom = determineHitRoom(otherShip, gameState.bulletArray[i].x, gameState.bulletArray[i].y);
          
          if (hitRoom) {
              const roomType =gameState.shipArray[otherShip.id].shipRooms[hitRoom.roomY][hitRoom.roomX]
              console.log(`The bullet hit room at (${hitRoom.roomX}, ${hitRoom.roomY}).`);
              if(gameState.shipArray[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`] === undefined){
                gameState.shipArray[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`]={health:100, onFire : 0, x:hitRoom.roomX, y:hitRoom.roomY, roomType: roomType}
              } 

              if(Math.random()<0.5 && gameState.shipArray[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].onFire < 100){
                gameState.shipArray[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].onFire += 10;
                if(gameState.shipArray[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].onFire > 100){
                  gameState.shipArray[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].onFire = 100
                  
                }
              }
              gameState.shipArray[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].health -= 10;
              if(gameState.shipArray[otherShip.id].roomDamage[`${hitRoom.roomX+','+hitRoom.roomY}`].health <= 0){
                destroyRoom(hitRoom.roomX, hitRoom.roomY, otherShip.id)
              }
              
              

              gameState.bulletArray.splice(i, 1)

          } else {
              console.log("The bullet hit an empty space or a non-collidable room.");
          }
          // Perform collision handling here...
          // for (let y = 0; y < gameState.shipArray[i].shipRooms.length; y++){
          //   for (let x = 0; x < gameState.shipArray[i].shipRooms[y].length; x++){
          //     const room = gameState.shipArray[i].shipRooms[y][x]
          //   }

          // }
        }
      })


    }

    for (let i = 0; i < gameState.shipArray.length; i++) {
      // Remove ship from quadtree before position update
    gameSpace.remove(gameState.shipArray[i]);
    const engineLocation = gameState.shipArray[i].engineLocation;
      if(gameState.shipArray[i].roomDamage[`${(engineLocation.x+1)+','+(engineLocation.y)}`] === undefined || gameState.shipArray[i].roomDamage[`${(engineLocation.x+1)+','+(engineLocation.y)}`].health>70 ){
        
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
      }

      
      gameState.shipArray[i].rotation += (gameState.shipArray[i].rotationVelocity * delta);

      gameState.shipArray[i].x += (gameState.shipArray[i].velocityX * delta);
      gameState.shipArray[i].y += (gameState.shipArray[i].velocityY * delta);

      for (let roomXY in gameState.shipArray[i].roomDamage) {
        const roomX = gameState.shipArray[i].roomDamage[roomXY].x
        const roomY = gameState.shipArray[i].roomDamage[roomXY].y

        if(gameState.shipArray[i].roomDamage[roomXY].onFire > 0){
          gameState.shipArray[i].roomDamage[roomXY].onFire += (0.1 * delta)
          for(let p = 0; p < gameState.shipArray[i].playersOnShip.length; p++){
            
            const playerID = gameState.shipArray[i].playersOnShip[p]
            const player = gameState.playerArray[playerID]
            if(player.insideRoomX === roomX && player.insideRoomY === roomY){
              gameState.shipArray[i].roomDamage[roomXY].onFire -= (0.3 * delta)
              gameState.playerArray[playerID].hp -= (0.2*delta)
              checkPlayerHealth(playerID)
            }
          }
          if(gameState.shipArray[i].roomDamage[roomXY].onFire >= 100){
            gameState.shipArray[i].roomDamage[roomXY].onFire = 100;
            fireSpread(gameState.shipArray[i].roomDamage[roomXY].x, gameState.shipArray[i].roomDamage[roomXY].y, i, delta)
            gameState.shipArray[i].roomDamage[roomXY].health -= 0.05
            if(gameState.shipArray[i].roomDamage[roomXY].health<=0){
              destroyRoom(gameState.shipArray[i].roomDamage[roomXY].x, gameState.shipArray[i].roomDamage[roomXY].y, i)
            }

          }
        }
      }


      // Perform collision logic...

      // const nearbyShips = [];
      // gameSpace.visit(function(node, x1, y1, x2, y2) {
      //   if (!node.length) {
      //     do {
      //       const otherShip = node.data;
      //       const distance = Math.sqrt((otherShip.x - gameState.shipArray[i].x) ** 2 + (otherShip.y - gameState.shipArray[i].y) ** 2);
      //       if (distance < 64*5 && otherShip !== gameState.shipArray[i] && otherShip.type != 1) {
      //         nearbyShips.push(otherShip);
      //       }
      //     } while (node = node.next);
      //   }
      //   return x1 > gameState.shipArray[i].x + 64*5 || x2 < gameState.shipArray[i].x - 64*5 || y1 > gameState.shipArray[i].y + 64*5 || y2 < gameState.shipArray[i].y - 64*5;
      // });

      // nearbyShips.forEach(otherShip => {
      //   const distance = Math.sqrt((otherShip.x - gameState.shipArray[i].x) ** 2 + (otherShip.y - gameState.shipArray[i].y) ** 2);
      //   if (distance < 64*5) {

      //     // Perform collision handling here...
      //     for (let y = 0; y < gameState.shipArray[i].shipRooms.length; y++){
      //       for (let x = 0; x < gameState.shipArray[i].shipRooms[y].length; x++){
      //         const room = gameState.shipArray[i].shipRooms[y][x]
      //       }

      //     }
      //   }
      // })
      

    }
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
      
      console.log(gameState.shipArray[0].playersOnShip)

      gameState.shipArray[shipIdDiedIn].playersOnShip = gameState.shipArray[shipIdDiedIn].playersOnShip.filter(players => players !== playerID);
      gameState.shipArray[0].playersOnShip.push(playerID)
      console.log(gameState.shipArray[0].playersOnShip)

    }
  }

  function destroyRoom(x, y, shipId){
    gameState.shipArray[shipId].shipRooms[y][x] = 0;
    delete gameState.shipArray[shipId].roomDamage[`${x+','+y}`];

  }

  function damageAbleRooms(room){
    if(room===1||room===2||room===5||room===6){
      return true
    }
  }

  function fireSpread(x, y, shipId, delta){
    let roomCheckX = 1
    let roomCheckY = 0
    if(damageAbleRooms(gameState.shipArray[shipId].shipRooms[y+roomCheckY][x+roomCheckX])){
      if(gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]===undefined){
        gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]={health:100, onFire : 0, x:x+roomCheckX, y:y+roomCheckY, roomType:gameState.shipArray[shipId].shipRooms[y+roomCheckY][x+roomCheckX]}
      }
      gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`].onFire += 0.05*delta

    }
    roomCheckX = -1
    if(damageAbleRooms(gameState.shipArray[shipId].shipRooms[y+roomCheckY][x+roomCheckX])){
      if(gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]===undefined){
        gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]={health:100, onFire : 0, x:x+roomCheckX, y:y+roomCheckY, roomType:gameState.shipArray[shipId].shipRooms[y+roomCheckY][x+roomCheckX]}
      }
      gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`].onFire += 0.05*delta

    }
    roomCheckX = 0
    roomCheckY = 1
    if(damageAbleRooms(gameState.shipArray[shipId].shipRooms[y+roomCheckY][x+roomCheckX])){
      if(gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]===undefined){
        gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]={health:100, onFire : 0, x:x+roomCheckX, y:y+roomCheckY, roomType:gameState.shipArray[shipId].shipRooms[y+roomCheckY][x+roomCheckX]}
      }
      gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`].onFire += 0.05*delta

    }
    roomCheckY = -1
    if(damageAbleRooms(gameState.shipArray[shipId].shipRooms[y+roomCheckY][x+roomCheckX])){
      if(gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]===undefined){
        gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`]={health:100, onFire : 0, x:x+roomCheckX, y:y+roomCheckY, roomType:gameState.shipArray[shipId].shipRooms[y+roomCheckY][x+roomCheckX]}
      }
      gameState.shipArray[shipId].roomDamage[`${(x+roomCheckX)+','+(y+roomCheckY)}`].onFire += 0.05*delta

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
      hp: 100,
      insideRoomX:2,
      insideRoomY:2,
      
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
        shipRooms: [
          [0, 0, 0, 0, 0],
          [0, 5, 4, 0, 0],
          [1, 1, 1, 2, 0],
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
    socket.on('shoot', (data) => {
      console.log("shoot")
      const playerArrayPosition = gameState.playerIDToIndex.get(socket.id);
      const shipArrayPosition = gameState.playerArray[playerArrayPosition].insideShip;
      if(gameState.playerArray[playerArrayPosition].mode === 0){
        return
      }
      if(gameState.playerArray[playerArrayPosition].mode === 1){

    
      for(let i = 0; i <gameState.shipArray[shipArrayPosition].weaponLocations.length; i++){

        const weaponLocation = gameState.shipArray[shipArrayPosition].weaponLocations[i];
        if(gameState.shipArray[shipArrayPosition].roomDamage[`${(weaponLocation.x-2)+','+(weaponLocation.y-1)}`] != undefined &&gameState.shipArray[shipArrayPosition].roomDamage[`${(weaponLocation.x-2)+','+(weaponLocation.y-1)}`].health<70 ){
          continue
        }
        // Calculate the adjusted coordinates based on ship rotation
        const cosAngle = Math.cos(gameState.shipArray[shipArrayPosition].rotation);
        const sinAngle = Math.sin(gameState.shipArray[shipArrayPosition].rotation);

        const adjustedX =
          gameState.shipArray[shipArrayPosition].x +
          (weaponLocation.x - 3) * 64 * cosAngle -
          (weaponLocation.y - 3) * 64 * sinAngle;

        const adjustedY =
          gameState.shipArray[shipArrayPosition].y +
          (weaponLocation.x - 3) * 64 * sinAngle +
          (weaponLocation.y - 3) * 64 * cosAngle;

              // Calculate initial velocities based on ship's direction and current velocity
        const bulletSpeed = 10; // You can adjust this value to set the initial bullet speed

        const shipVelocityX = gameState.shipArray[shipArrayPosition].velocityX;
        const shipVelocityY = gameState.shipArray[shipArrayPosition].velocityY;

        const bulletVelocityX = bulletSpeed * cosAngle + shipVelocityX;
        const bulletVelocityY = bulletSpeed * sinAngle + shipVelocityY;

        const newBullet = {
          dateOfBirth: Date.now(),
          x: adjustedX,
          y: adjustedY,
          velocityX: bulletVelocityX,
          velocityY: bulletVelocityY,
          rotation: gameState.shipArray[shipArrayPosition].rotation,
          type: 1,
      };
        gameState.bulletArray.push(newBullet)
        
        gameSpace.add(newBullet); 

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