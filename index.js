const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 3000;

const server = express()
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

var count = 0;

server.use(bodyParser.json());



io.on('connection', (socket) => {
  console.log('Client connected');
  count++;
  io.emit('alert', {meg: count});
  socket.on('disconnect', () => console.log('Client disconnected'));
});

server.get('/',function (req,res)  {
  console.log('Recieved Get');
  res.send('Hello');
});

server.post('/', function (req, res) {
  count++;
  console.log('Recieved post')
});
