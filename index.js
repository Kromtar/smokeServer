const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = express()
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

var count = 0;

const app = express()
io.on('connection', (socket) => {
  console.log('Client connected');
  count++;
  io.emit('alert', {meg: count});
  socket.on('disconnect', () => console.log('Client disconnected'));
});

app.get('/',function(req,res){
  res.send('Hello')
});

app.post('/', function (req, res) {
  count++;
  console.log('Recieved post')
});
