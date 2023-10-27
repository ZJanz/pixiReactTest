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


io.on('connection', (socket) => {
  console.log('A user connected');

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