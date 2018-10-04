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


//Variables de prueba antes de hacer la base de datos
var kitId = 1;
var kitName = 'Nikola Tesla';
var userId = 1;
var statusTest = "NORMAL";
var sensors = [1, 2, 3];

console.log(sensors[1]);

var UserIdList = [];
var SocketIdList = [];

io.on('connection', function(socket){
  console.log('Client connected, ID = ',socket.id);


//No se me ocurrio una mejor forma, pero cuando ingresa una app, envia su id, y se agrega a 2 arrays que siempre estan juntos, cuando se ingresa algo a uno, el otro tiene el mismo index
socket.on('AppLogin', function(data){

UserIdList.push(data);
SocketIdList.push(socket.id);


});

//La aplicacion me envia una pregunta sobre si hay alerta y el servidor responde con ALERT o ALL OK
  socket.on('AppAlert', function(data){
    if(userId === data){

      if (statusTest === 'ALERT'){
        socket.emit('appIsThereAlert','ALERT');
    }
    else {
      socket.emit('appIsThereAlert','ALL OK');
  }
     
      }
  });

  //El detector de humo envia una alerta y el servidor le pide a todos los conectados (apps) que envien su nombre para saber que socket son
    socket.on('SensorAlert', function(data){

      //Ingresar AQUI la alerta a la base de datos (WIP)

for (i = 0; i < UserIdList.length; i++){
  if (UserIdList[i] === data){
    io.to(SocketIdList[i]).emit('ALERT');
  }
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

      socket.on('disconnect', function(){
for (i = 0; i < SocketIdList.length; i++){
  if (SocketIdList[i] === socket.id){
    SocketIdList.splice(i, 1);
    UserIdList.splice(i, 1);
  }
}
        console.log('user disconnected');
    });
});

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
