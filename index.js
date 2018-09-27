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
  io.emit('alert', {msg: status});
  res.send('Llego alerta! ')
});

httpApp.post('/arduinoId1', function(req,res){
  console.log(req.body)
  status = 'ALERT'
  io.emit('alert', {msg: status});
  res.send('Llego alerta! ')
});

httpApp.post('/debug',function(req,res){
  status = 'NORMAL'
  res.send('Cambio status a NORMAL')
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));


/***********************************************************************SOCKET!!***********************************************************************/
/***********************************************************************SOCKET!!***********************************************************************/

//Crea el objeto que contiene todos los datos de un kit de detectores de humo
var smokeDetectorTest = new SmokeDetector(1, 'nombre', 1, 3);
console.log(smokeDetectorTest.sensors[1]);

io.on('connection', function(socket){
  console.log('Client connected');

//La aplicacion me envia una pregunta sobre si hay alerta y el servidor responde con ALERT o ALL OK
  socket.on('appIsThereAlert', function(data){
    if(smokeDetectorTest.userId == data){

      if (smokeDetectorTest.alert == 'ALERT'){
        socket.emit('appIsThereAlert','ALERT');
    }
    else {
      socket.emit('appIsThereAlert','ALL OK');
  }
     
      }
  });
  //El detector de humo envia una alerta y el servidor le pide a todos los conectados (apps) que envien su nombre para saber que socket son
    socket.on('SensorAlert', function(data){
      if (smokeDetectorTest.kitId == data){
        smokeDetectorTest.status = 'ALERT'

        socket.broadcast.emit('broadcast', 'askForResponse');
      }
  });
  //Listening to 'qr'
  socket.on('qr',function(data){
    console.log(data);
  });
  // Listening to 'alertResponse' and if body === false change it to normal1
  socket.on('alertresponse',function(data){
    console.log(data);
    if(data.response==false){
      status = 'NORMAL';
    }
  });
  socket.on('disconnect', () => console.log('Client disconnected'));
});


class SmokeDetector {
  constructor(kitId, kitName, userId, numberOfSensors) {  

  this.kitId = kitId;
  this.kitName = kitName;
  this.userId = userId;
  this.numberOfSensors = numberOfSensors;
  var status = "NORMAL";
  var sensors = [];

  var i = 0;
  while(numberOfSensors > 0){
    sensors.push(i);
    i++;
    numberOfSensors--;
  } 


/*
var count= 0
io.on('connection', function(socket){
  console.log('Client connected');
  count++;
  if(status == 'ALERT'){
    io.emit('alert', {msg: status});
  }
  io.emit('test',{msg:count});
  //Listening to 'qr'
  socket.on('qr',function(data){
    console.log(data);
  });
  // Listening to 'alertResponse' and if body === false change it to normal1
  socket.on('alertresponse',function(data){
    console.log(data);
    if(data.response==false){
      status = 'NORMAL';
    }
  });
  socket.on('disconnect', () => console.log('Client disconnected'));
});
*/