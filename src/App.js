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
      {/* {renderBunnies(gameState.playerArray)} */}
    </Stage>
  );
}

function renderBunnies(playerArray, cameraX, cameraY) {
  return playerArray.map((player, index) => (
    <Pod key={index} x={player.x - cameraX} y={player.y -cameraY} rotation={player.rotation} />
    
  ));
}

function Pod({ x, y, rotation }) {
  return (
    <Container x={x} y={y} pivot={{ x: 0.5, y: 0.5 }} rotation={rotation}>
      <Sprite
        image={'/pod.png'}
        x={0}
        y={0}
        anchor={{ x: 0.5, y: 0.5 }}
        // rotation={rotation}
      />
      <Sprite
        image={'/captainsWheel.png'}
        x={0}
        y={0}
        anchor={{ x: 0.5, y: 0.5 }}
        // rotation={rotation}

      />
      <Sprite
        image={'/jetEngine.png'}
        x={-64}
        y={0}
        anchor={{ x: 0.5, y: 0.5 }}
        // rotation={rotation}

      />
    </Container>
  );
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
    playerArray: []
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
    // Update history when serverState changes
    if(gameState.playerArray[indexInPlayerArray] === undefined){return}
    setX(gameState.playerArray[indexInPlayerArray].x - window.innerWidth/2)
    setY(gameState.playerArray[indexInPlayerArray].y - window.innerHeight/2)
  }, [gameState]);

  useTick((delta) => {
    
      // Calculate the target timestamp (current time - desired delay)
      const targetTimestamp = Date.now() - 100;

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
      console.log('Received message from the server:', data);
    });

    return () => {
      socket.off('serverMessage');
    };
  }, [socket]);

  return (
    <>
      <GridBackground x={x} y={y} />
      
      {renderBunnies(gameState.playerArray, x, y)}

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
