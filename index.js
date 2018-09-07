const express = require('express')
const http = require('http')
const socketIO = require('socket.io')

const PORT = process.env.PORT || 3000;

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

var count = 0;

io.on('connection', socket => {
  console.log('Client connected');
  count++;
  io.emit('alert', {msg: count});
  socket.on('disconnect', () => console.log('Client disconnected'));
})

server.listen(PORT, () => console.log(`Listening on port ${PORT}`))
