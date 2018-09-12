var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var httpApp = express();

//Control de acceso
httpApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

//Formato de consultas
httpApp.use(bodyParser.urlencoded({ extended: false }));
httpApp.use(bodyParser.json());
httpApp.use(bodyParser.text());

var server = require('http').createServer(httpApp);
//var serverhttp = require('http').createServer(httpApp);
var io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;

var  status = 'NORMAL';
//Display index.html
httpApp.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});
// Get end-point arduino and send Status var
httpApp.get('/arduino', function(req, res) {
  res.send(status);
});
// Post on end-point arduino and print the body, change status and emit alert
httpApp.post('/arduino', function(req,res){
  console.log(req.body)
  status = 'ALERT'
  res.send('Llego alerta! ')
  io.emit('alert', {msg: status});
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
//serverhttp.listen(PORT, () => console.log(`Listening on port ${PORT}`));

var count= 0 
//Connection counter
io.on('connection', socket => {
  console.log('Client connected');
  count++;
  socket.on('disconnect', () => console.log('Client disconnected'));
});
//Listening to 'qr' 
io.on('qr',function(data){ 
  console.log(data);
});
// Listening to 'alertResponse' and if body === false change it to normal
io.on('alertResponse',function(req,res){
  if(req.body===false){
    status = 'NORMAL';
  }
});