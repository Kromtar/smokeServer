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

var server = require('http').createServer(app);
var serverhttp = require('http').createServer(httpApp);
var io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;


app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

httpApp.post('/arduino', function(req,res){
  console.log(req.body)
  res.send('Llego ! ')
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
serverhttp.listen(PORT, () => console.log(`Listening on port ${PORT}`));

var count= 0 
io.on('connection', socket => {
  console.log('Client connected');
  count++;
  io.emit('alert', {msg: count});
  socket.on('qr',function(data){ console.log(data);});
  socket.on('disconnect', () => console.log('Client disconnected'));
})
