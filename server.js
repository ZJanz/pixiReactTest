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
    direction: 1.3082443894581433,
    id: "AhzgAtklgo2FJvwWAADO",
    hp: 100
  }],
}

function update(){
  for(i=0; i<gameState.playerArray.length; i++){
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
    direction: 0,
    id: socket.id,
    hp: 100
  })
  console.log(gameState.playerArray)

  socket.on('movement', (data) => {
    console.log('Received movement key:', data.key);
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