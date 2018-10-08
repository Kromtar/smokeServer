var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => console.log(`Listening on port ${PORT}`));

var users = {};
var sensorkits = {};

require('./fakerResponses');

io.on('connection', socket => {
  //console.log('Device connnect', socket);

  socket.on('loginapp', (data) => {
    console.log(data.phoneid);
    users[data.phoneid] = socket;
  });

  socket.on('loginsensorkit', (data) => {
    sensorkits[data.sensorid] = socket;
  });

  socket.on('checkallstatus', (data) => {
    //Buscar el estado de los kit sensor de "data.phoneid" en la base de datos
    socket.emit('allKitsStatus', fakeAllKitsStatusResponse);
  });

  socket.on('alertresponse', (data) => {
    //Aqui entramos en la db y cambiamos el estado de le
    //alerta del kit sensor "data.kitID" con la respuesta "data.response"
    //Luego actualizamos el estado de todos los otros conectados a dicho sensor kit
    //Y avisamos al sensorkit que tiene que hacer
    //aqui se ocupa el evento "alertResponseConfirm"
    console.log(data);
  });

  //Aqui va el evento de alerta del sensor
  socket.on('alertfromsensor', (data) => {
    //Se actualiza la db
    //Se buscan las apps conectadas a dicho sensor y se envia el mensaje
    //"fakerappconnectedtosensor" es unsa respues de la DB falsa con la ids
    //de los celulares conectados
    for (user = 0; user < fakerappconnectedtosensor.length; user++){
      if(users[fakerappconnectedtosensor[user]] !== undefined){
        users[fakerappconnectedtosensor[user]].emit('alert', fakeAlertResponse);
      }
    }
  });

  socket.on('disconnect', () => {
    //Busca si el que se desconecta es una app
    for(var phoneid in users){
      if(users[phoneid] === socket){
        delete users[phoneid];
      }
    }
    //Busca si lo que se desconecta es un sensorkit
    for(var sensorkitid in sensorkits){
      if(sensorkits[sensorkitid] === socket){
        delete sensorkits[sensorkitid];
      }
    }
    //console.log('Device disconnected');
  });

});
