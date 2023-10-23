import React, { useState, useEffect, useRef } from 'react';
import { BlurFilter } from 'pixi.js';
import { Stage, Container, Sprite, Text, useTick, Graphics } from '@pixi/react';
import { useMemo } from 'react';
import io from 'socket.io-client';
const socket = io.connect("http://localhost:3001")
export default function App() {
  const blurFilter = useMemo(() => new BlurFilter(4), []);

  const cameraRef = useRef(null);

  // const socket = io('http://localhost:3001'); // Replace with your server URL

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Bunny cameraRef={cameraRef} socket={socket} />
    </Stage>
  );
}

function Bunny({ cameraRef, socket }) {
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

  useTick((delta) => {
    setI(i + 0.05 * delta);
    if (wKey === true && sKey === false && aKey === false && dKey === false) {
      setVelocityY(velocityY - 1 * delta);
    }
    if (sKey === true && wKey === false && aKey === false && dKey === false) {
      setVelocityY(velocityY + 1 * delta);
    }
    if (aKey === true && sKey === false && wKey === false && dKey === false) {
      setVelocityX(velocityX - 1 * delta);
    }
    if (dKey === true && sKey === false && aKey === false && wKey === false) {
      setVelocityX(velocityX + 1 * delta);
    }
    if (wKey === true && sKey === false && aKey === true && dKey === false) {
      setVelocityY(velocityY - 0.5 * delta);
      setVelocityX(velocityX - 0.5 * delta);
    }
    if (wKey === true && sKey === false && aKey === false && dKey === true) {
      setVelocityY(velocityY - 0.5 * delta);
      setVelocityX(velocityX + 0.5 * delta);
    }
    if (sKey === true && wKey === false && aKey === true && dKey === false) {
      setVelocityY(velocityY + 0.5 * delta);
      setVelocityX(velocityX - 0.5 * delta);
    }
    if (sKey === true && wKey === false && aKey === false && dKey === true) {
      setVelocityY(velocityY + 0.5 * delta);
      setVelocityX(velocityX + 0.5 * delta);
    }

    setX(x + velocityX * delta);
    setY(y + velocityY * delta);
    setRotation(Math.sin(i) * Math.PI);

    if (cameraRef.current) {
      cameraRef.current.position.set(-x + 400, -y + 270);
    }
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'w':
          setWKey(true);
          socket.emit('movement', { key: 'w' });
          break;
        case 's':
          setSKey(true);
          socket.emit('movement', { key: 's' });
          break;
        case 'a':
          setAKey(true);
          socket.emit('movement', { key: 'a' });
          break;
        case 'd':
          setDKey(true);
          socket.emit('movement', { key: 'd' });
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.key) {
        case 'w':
          setWKey(false);
          break;
        case 's':
          setSKey(false);
          break;
        case 'a':
          setAKey(false);
          break;
        case 'd':
          setDKey(false);
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
      <Sprite
        image={'https://pixijs.io/pixi-react/img/bunny.png'}
        x={300}
        y={300}
        anchor={{ x: 0.5, y: 0.5 }}
        rotation={rotation}
      />
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
