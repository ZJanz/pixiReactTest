import React, { useState, useEffect, useRef } from 'react';
import { BlurFilter } from 'pixi.js';
import { Stage, Container, Sprite, Text, useTick, Graphics } from '@pixi/react';
import { useMemo } from 'react';
import io from 'socket.io-client';
const socket = io('http://localhost:3001');

export default function App() {

  //MOVE THIS ALL TO CAMERA
  

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Camera />
    </Stage>
  );
}

function renderActualShips(playerArray, shipMap, cameraX, cameraY){

  const shipValues = Object.values(shipMap);
  return shipValues.map((ship, index) => (
    <Ship key={index} x={ship.x - cameraX} y={ship.y -cameraY} rotation={ship.rotation} ship={ship} playerArray={playerArray} />
  )
  );
}

function Ship({ x, y, rotation, ship, playerArray }){
  const shipRoomArray = ship.shipRooms.map((row, shipRoomY) => (
    <Container key={shipRoomY}>
      <>
      {row.map((shipRoom, shipRoomIndex) => (
        // <span key={shipRoomX}/>
        <>
          {shipRoom === 1 &&(
          <BasicRoom
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
          />
          )}
          {shipRoom === 2 &&(
          <PodRoom
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
          />
          )}
          {shipRoom === 3 &&(
          <Engine
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
            moveForward={ship.moveForward}
          />
          )}
          {shipRoom === 4 &&(
          <WeaponPossibly
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
          />
          )}
          {shipRoom === 5 &&  (ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`] === undefined || ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`].health >= 100)&&(
          <WeaponRoom
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
            health = {100}
          />
          )}
          {shipRoom === 5 && ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`]!=undefined &&(
          <WeaponRoom
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
            health = {ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`].health}
          />
          )}
           {shipRoom === 6 &&  (ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`] === undefined || ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`].health >= 100)&&(
          <EngineRoom
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
            health = {100}
          />
          )}
          {shipRoom === 6 && ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`]!=undefined &&(
          <EngineRoom
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
            health = {ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`].health}
          />
          )}
          {shipRoom === 7 &&  (ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`] === undefined || ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`].health >= 100)&&(
          <PilotRoom
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
            health = {100}
          />
          )}
          {shipRoom === 7 && ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`]!=undefined &&(
          <PilotRoom
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
            health = {ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`].health}
          />
          )}


          {ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`] != undefined && ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`].onFire > 0&&(
          <Fire
            x={shipRoomIndex * 64}
            y={shipRoomY * 64}
            onFire={ship.roomDamage[`${shipRoomIndex+','+shipRoomY}`].onFire}
          />
          )}
        </>
      ))}
        {ship.playersOnShip.length>0 && ship.playersOnShip.map((player, index) => (
          <Player key={index} x={playerArray[player].x} y={playerArray[player].y} id={playerArray[player].id} />
        ))}
      </>
    </Container>
  ));

  return (
    <Container x={x} y={y} pivot={{ x: 32*5, y: 32*5 }} rotation={rotation}>
      {shipRoomArray}
    </Container>
  )
}

function WeaponPossibly({x, y}){
  return (
    <Sprite
      image={'/weaponIGuess.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />
  );

}

function Fire({x, y, onFire }){
  const scaleFactor = 0.1 + onFire / 200; // Adjust the scaling factor as needed
  const scale = { x: scaleFactor, y: scaleFactor };
  const roomCenterX = x + 32;
  const roomCenterY = y + 32;

  const xAdjust = roomCenterX - (32 * scaleFactor);
  const yAdjust = roomCenterY - (32 * scaleFactor);


  return (
    <Sprite
      scale = {scale}
      image={'/fire.png'}
      x={xAdjust}
      y={yAdjust}
      anchor={{ x: 0, y: 0 }}
    />
  );

}

function renderBullets(bulletArray, cameraX, cameraY){
  // console.log(shipArray)
  return bulletArray.map((bullet, index) => (
    <Bullet key={index} x={bullet.x - cameraX} y={bullet.y -cameraY} rotation={bullet.rotation} bullet={bullet} />
  )
  );
}

function renderAsteroids(asteroidArray, cameraX, cameraY){
  // console.log(shipArray)
  return asteroidArray.map((asteroid, index) => (
    <Asteroid key={index} x={asteroid.x - cameraX} y={asteroid.y -cameraY} asteroid={asteroid} />
  )
  );
}

function Bullet({x, y, rotation}){
  return(
  <Sprite
      image={'/bullet.png'}
      x={x}
      y={y}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={rotation}
      cullable={true}
    />
  )
}

function Asteroid({x, y, rotation}){
  return(
  <Sprite
      image={'/asteroid.png'}
      x={x}
      y={y}
      anchor={{ x: 0.5, y: 0.5 }}
      cullable={true}
    />
  )
}


function Player({x, y}) {
  return (
    <Sprite
      image={'/stickman.png'}
      x={x-8}
      y={y-17}
      anchor={{ x: 0, y: 0 }}
    />
  );
}

function WeaponRoom({x, y, health}){
  return(
    <>
    <BasicRoom
    x={x}
    y={y}
   />
   {health >= 100 && <Sprite
      image={'/weaponIcon.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    {health < 100 && health >= 70 && <Sprite
      image={'/weaponIconDamaged.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    {health < 70 && <Sprite
      image={'/weaponIconBroken.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    </>
  )
}
function EngineRoom({x, y, health}){
  return(
    <>
    <BasicRoom
    x={x}
    y={y}
   />
   {health >= 100 && <Sprite
      image={'/engineRoomIcon.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    {health < 100 && health >= 70 && <Sprite
      image={'/engineRoomIconDamaged.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    {health < 70 && <Sprite
      image={'/engineRoomIconBroken.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    </>
  )
}

function PilotRoom({x, y, health}){
  return(
    <>
    <BasicRoom
    x={x}
    y={y}
   />
   {health >= 100 && <Sprite
      image={'/pilotIcon.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    {health < 100 && health >= 70 && <Sprite
      image={'/pilotIconDamaged.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    {health < 70 && <Sprite
      image={'/pilotIconBroken.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />}
    </>
  )
}

function BasicRoom({ x, y }) {
  return (
    <Sprite
      image={'/basicRoom.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />
  );
}

function PodRoom({ x, y }) {
  return (
    <Sprite
      image={'/pod.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />
  );
}

// function renderShips(playerArray, shipArray, cameraX, cameraY) {
//   // return playerArray.map((player, index) => (
//   //   <Pod key={index} x={player.x - cameraX} y={player.y -cameraY} rotation={player.rotation} player={player} />
//   // )
  
//   return shipArray.map((player, index) => (
//     <Pod key={index} x={player.x - cameraX} y={player.y -cameraY} rotation={player.rotation} player={player} />
//   )

//   );
// }

function Pod({ x, y, rotation, player }) {
  return (
    <Container x={x} y={y} pivot={{ x: 0, y: 0 }} rotation={rotation}>
      <Sprite
        image={'/pod.png'}
        x={0}
        y={0}
        anchor={{ x: 0, y: 0 }}
      />
      {true &&(
      <Sprite
        image={'/captainsWheel.png'}
        x={0}
        y={0}
        anchor={{ x: 0, y: 0 }}
      />
      
      )}
      <Engine moveForward = {player.moveForward} x={-64} y ={0}/>
      
    </Container>
  );
}

function Engine({moveForward, x, y}) {
  return(
    <>
  {moveForward === true &&(
    <Sprite
      image={'/jetEngine.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />
    )}
    {moveForward != true &&(
    <Sprite
      image={'/jetEngineOff.png'}
      x={x}
      y={y}
      anchor={{ x: 0, y: 0 }}
    />
    )}
    </>
  )
}

function Camera() {

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [velocityX, setVelocityX] = useState(0);
  const [i, setI] = useState(0);
  const [wKey, setWKey] = useState(false);
  const [aKey, setAKey] = useState(false);
  const [sKey, setSKey] = useState(false);
  const [dKey, setDKey] = useState(false);
  const [rotation, setRotation] = useState(0);

  const [indexInPlayerArray, setIndexInPlayerArray] = useState(0);
  const [gameState, setGameState] = useState({
    t: Date.now(),
    playerArray: [],
    shipMap: {},
    bulletArray: [],
    asteroidArray: [],

  });
  const [serverState, setServerState] = useState(gameState)
  const [history, setHistory] = useState([gameState])
  useEffect(() => {
    socket.on('gameState', (serverGameState) => {
      setServerState(serverGameState);
    });
  
    socket.on("indexInPlayerArray", (index) => {
      setIndexInPlayerArray(index);
    });
  
    // Cleanup the socket listeners when the component unmounts
    return () => {
      socket.off('gameState');
    };
  }, []);
  
  useEffect(() => {
    // Update history when serverState changes
    setHistory((prevHistory) => [...prevHistory, serverState]);
  }, [serverState]);
  
  useEffect(() => {
    if(gameState.playerArray[indexInPlayerArray] === undefined){return}
    console.log(gameState.playerArray[indexInPlayerArray].insideShip)
    if(gameState.playerArray[indexInPlayerArray].insideShip === undefined){
      setX(gameState.playerArray[indexInPlayerArray].spaceX - window.innerWidth/2)
      setY(gameState.playerArray[indexInPlayerArray].spaceY - window.innerHeight/2)
      return
    }
    setX(gameState.shipMap[gameState.playerArray[indexInPlayerArray].insideShip].x - window.innerWidth/2)
    setY(gameState.shipMap[gameState.playerArray[indexInPlayerArray].insideShip].y- window.innerHeight/2)
  }, [gameState]);

  useTick((delta) => {
    
      // Calculate the target timestamp (current time - desired delay)
      const targetTimestamp = Date.now() - 200;

      // Find the state from the history that is closest to the target timestamp
      let closestState = history[0];
      for (let i = 0; i < history.length; i++) {
        if (history[i].t <= targetTimestamp) {
          closestState = history[i];
        } else {
          setHistory(history.slice(i));
          break;
        }
      }

      // Set the game state to the closest state
      setGameState(closestState);

    // setRotation(Math.sin(i) * Math.PI);

  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'e':
          setWKey(true);
          socket.emit('movement', { key: 'e' });
          break;
        case 'q':
          setWKey(true);
          socket.emit('movement', { key: 'q' });
          break;
        case 'w':
          setWKey(true);
          socket.emit('movement', { key: 'w' });
          break;
        case 'a':
          setWKey(true);
          socket.emit('movement', { key: 'a' });
          break;
        case 's':
          setWKey(true);
          socket.emit('movement', { key: 's' });
          break;
        case 'd':
          setWKey(true);
          socket.emit('movement', { key: 'd' });
          break;
        case 'f':
          setWKey(true);
          socket.emit('interact', { key: 'f' });
          break;
        case 'g':
          socket.emit('shoot', { key: 'g' });
          break;
        case 'j':
          socket.emit('eject', { key: 'j' });
          break;
        // case 's':
        //   setSKey(true);
        //   socket.emit('movement', { key: 's' });
        //   break;
        // case 'a':
        //   setAKey(true);
        //   socket.emit('movement', { key: 'a' });
        //   break;
        // case 'd':
        //   setDKey(true);
        //   socket.emit('movement', { key: 'd' });
        //   break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.key) {
        case 'w':
          setWKey(false);
          socket.emit('stopMovement', { key: 'w' });
          break;
        case 's':
          setSKey(false);
          socket.emit('stopMovement', { key: 's' });
          break;
        case 'a':
          setAKey(false);
          socket.emit('stopMovement', { key: 'a' });
          break;
        case 'd':
          setDKey(false);
          socket.emit('stopMovement', { key: 'd' });
          break;
        case 'e':
          socket.emit('stopMovement', { key: 'e' });
          break;
        case 'q':
          socket.emit('stopMovement', { key: 'q' });
          break;
        
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [x, y]);

  useEffect(() => {
    socket.on('serverMessage', (data) => {
      
    });

    return () => {
      socket.off('serverMessage');
    };
  }, [socket]);
  if(gameState.playerArray[indexInPlayerArray] === undefined){return}
  return (
    <>
      <GridBackground x={x} y={y} />
      
      {/* {renderShips(gameState.playerArray, gameState.playerArray, x, y)} */}
      {renderAsteroids(gameState.asteroidArray, x, y)}
      {renderActualShips(gameState.playerArray, gameState.shipMap, x, y)}
      {renderBullets(gameState.bulletArray, x, y)}
      <Text 
    text={`Inventory: Nickle: ${gameState.shipMap[gameState.playerArray[indexInPlayerArray].insideShip].inventory.nickle}`}
    anchor={0.5}
    x={150}
    y={150}
    style={{
      fill: 'white' // Use fill to set the text color
  }} />
      


    </>
  );
}

function GridBackground({ x, y }) {
  return (
    <Graphics
      draw={(g) => {
        g.clear();
        g.lineStyle(1, 0xffffff, 0.2);
        for (let i = 0; i < window.innerWidth; i += 50) {
          g.moveTo(i - (x % 50), 0);
          g.lineTo(i - (x % 50), window.innerHeight);
        }
        for (let j = 0; j < window.innerHeight; j += 50) {
          g.moveTo(0, j - (y % 50));
          g.lineTo(window.innerWidth, j - (y % 50));
        }
      }}
    />
  );
}
