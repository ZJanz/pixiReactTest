import React, {useState} from 'react';
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
  const [i, setI] = useState(0);

  const [rotation, setRotation] = useState(0);

  // custom ticker
  useTick(delta => {
    setI(i+ 0.05 * delta);
    setX(x+1*delta);
    setY(y+1*delta);
    setRotation(Math.sin(i) * Math.PI);
  });



  return(<Sprite 
    image={"https://pixijs.io/pixi-react/img/bunny.png"} 
    x={x} 
    y={y} 
    anchor={{x:0.5, y:0.5}}
    rotation={rotation}
    />)
}




