var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/bower_components'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

var count= 0 
io.on('connection', socket => {
  console.log('Client connected');
  count++;
  io.emit('alert', {msg: count});
  socket.on('qr',function(data){ console.log(data);});
  socket.on('disconnect', () => console.log('Client disconnected'));
})
