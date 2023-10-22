import React, {useState, useEffect} from 'react';
import { BlurFilter } from 'pixi.js';
import { Stage, Container, Sprite, Text, useTick  } from '@pixi/react';
import { useMemo } from 'react'

let bunnyx = 400
let bunnyy = 270
export default function App() {
  const blurFilter = useMemo(() => new BlurFilter(4), []);
  return (
    <Stage width={800} height={600}>
      <Bunny
        />
      <Container x={400} y={270}>
        <Text text="Hello World" anchor={{x:0.5, y:0.5}} filters={[blurFilter]} />
      </Container>
    </Stage>

  );
}



function Bunny(){

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

  // custom ticker
  useTick(delta => {
    setI(i+ 0.05 * delta);
    if(wKey === true && sKey === false && aKey === false && dKey === false){
      setVelocityY(velocityY-1*delta);
    }
    if(sKey === true && wKey === false && aKey === false && dKey === false){
      setVelocityY(velocityY+1*delta);
    }
    if(aKey === true && sKey === false && wKey === false && dKey === false){
      setVelocityX(velocityX-1*delta);
    }
    if(dKey === true && sKey === false && aKey === false && wKey === false){
      setVelocityX(velocityX+1*delta);
    }

    if(wKey === true && sKey === false && aKey === true && dKey === false){
      setVelocityY(velocityY-0.5*delta);
      setVelocityX(velocityX-0.5*delta);
    }
    if(wKey === true && sKey === false && aKey === false && dKey === true){
      setVelocityY(velocityY-0.5*delta);
      setVelocityX(velocityX+0.5*delta);
    }
    if(sKey === true && wKey === false && aKey === true && dKey === false){
      setVelocityY(velocityY+0.5*delta);
      setVelocityX(velocityX-0.5*delta);
    }
    if(sKey === true && wKey === false && aKey === false && dKey === true){
      setVelocityY(velocityY+0.5*delta);
      setVelocityX(velocityX+0.5*delta);
    }

    setX(x+velocityX*delta);
    setY(y+velocityY*delta);
    setRotation(Math.sin(i) * Math.PI);
  });
  useEffect(() => {
    // Add event listeners for keyboard controls
    const handleKeyDown = event => {
      switch (event.key) {
        case 'w':
          setWKey(true)
          break;
        case 's':
          setSKey(true)
          break;
        case 'a':
          setAKey(true)
          break;
        case 'd':
          setDKey(true)
          break;
        default:
          break;
      }
    };
      const handleKeyUp = event => {
        switch (event.key) {
          case 'w':
            setWKey(false)
            break;
          case 's':
            setSKey(false)
            break;
          case 'a':
            setAKey(false)
            break;
          case 'd':
            setDKey(false)
            break;
          default:
            break;
        }
    };
    window.addEventListener('keyup', handleKeyUp);

    window.addEventListener('keydown', handleKeyDown);

    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [x, y]);


  return(<Sprite 
    image={"https://pixijs.io/pixi-react/img/bunny.png"} 
    x={x} 
    y={y} 
    anchor={{x:0.5, y:0.5}}
    rotation={rotation}
    />)
}




