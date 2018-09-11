var express = require('express');
var bodyParser = require('body-parser')
var app = express();

//Control de acceso
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

//Formato de consultas
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text);

var server = require('http').createServer(app);
var io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/bower_components'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

app.post('/arduino', function(req,res){
  console.log(req)
  res.send('Llego ! ')
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
