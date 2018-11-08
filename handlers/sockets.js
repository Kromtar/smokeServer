const {sendPushNotification} = require('./pushNotifications');
const kitsController = require('../dbControllers/kits');
const {callPhone} = require('./twilio');

function socket(server){
  const io = require('socket.io')(server);

  appsConnected = [];
  kitsConnected = [];

  //Al ejecutarse una coneccion de socket.io
  io.on('connection', function(socket) {

    //Registro de aplicaciones conectadas
    socket.on('applogin', function(data) {
      appsConnected.push({
        phoneid: data.phoneid,
        socket
      });
      console.log("Hay: " + appsConnected.length + " celulares conectados");
    });

    //Registro de kits conectados
    socket.on('loginsensorkit', async function(data) {
      await kitsController.addNewKit(data);
      kitsConnected.push({
        kitId: data.kitId,
        socket
      });
      console.log("Hay: " + kitsConnected.length + " kits conectados");
    });

    //TODO: ???
    socket.on('kitupdatestatus', async function(data){
      await kitsController.updateKit(Object.keys(data)[0], data[Object.keys(data)[0]]);
    });

    //Alerta desde el kit
    socket.on('alertfromsensor', async function(data) {
      //Actualiza el estado del kit en la DB
      const kitId = Object.keys(data)[0];
      const dataOfKit = data[Object.keys(data)[0]];
      await kitsController.updateKit(kitId, dataOfKit);
      //Busca los usuarios registrados a ese kit
      let listOfPhones = await kitsController.phonesFromKit(kitId);
      //console.log(listOfPhones);
      //Busca cuales de esos usuarios estan conectados actualmente
      for (app = 0; app < appsConnected.length; app++) {
        for (phone = 0; phone < listOfPhones.length; phone++) {
          if (appsConnected[app].phoneid === listOfPhones[phone].phoneId) {
            //Envia alerta a usuarios conectados actualemente
            appsConnected[app].socket.emit('alert', {data});
            //console.log('ALERT SENDED TO ', appsConnected[i].socket.id);
          }
        }
      }
      //Registra los tokes de la push notifications de los usuarios registrados al kit
      expoTokens = [];
      for (phone = 0; phone < listOfPhones.length; phone++) {
        expoTokens.push(listOfPhones[phone].phonePushToken);
      }
      //Envia las pushnotification mediante el manejador de EXPO
      await sendPushNotification(expoTokens,data);
      //Realiza una llamada al primer celular registrado al kit
      //TODO: Que se llame a todos los celulares
      if(listOfPhones[0].phoneNumber !== ''){
        callPhone(listOfPhones[0].phoneNumber);
      }
    });

    //Ve los kits de un usuario
    //TODO: Se esta usando facker
    //TODO: Remover elements, refactor app
    socket.on('checkallstatus', async function(data) {
      //console.log("Buscando kits de:",data);
      const kitsFromPhone = await kitsController.kitsFromPhone(data.phoneId);
      if(kitsFromPhone.length === 0){
        socket.emit('allkitsstatus', {"elements": false});
      }else{
        //Crea la lista de los kits para enviar
        kitsList = {};
        for(kit = 0; kit < kitsFromPhone.length; kit++){
          Object.assign(kitsList, {
            [kitsFromPhone[kit].kitId]: {
                "kitName": 'Nombre kit 1',
                "kitStatus": kitsFromPhone[kit].kitStatus,
                "sensor": {
                    "k1000s1": {
                        "nombre": 'Sensor 1 del  kit 1',
                        "status": 'bien'
                    },
                    "k1000s2": {
                        "nombre": 'Sensor 2 del kit 1',
                        "status": 'bien'
                    }
                }
            }
          });
        }
        socket.emit('allkitsstatus', {
          "elements": true,
          kitsList
        });
      }
    });

    //Respuesta a la alerta desde una app
    //TODO: Usa facker
    //TODO: Añadir que pasa cuando es verdadero
    socket.on('alertresponse', async function(data) {
      const { response, kitId } = data;
      //console.log('Alert Response From APP =', data);
      if (response === "falso") {
        //Se actualiza el estado del kit en la DB
        await kitsController.updateKit(kitId, {kitStatus: "bien"});
        //Busca los celulares registrados a un kit
        const listOfPhones = await kitsController.phonesFromKit(kitId);
        for (app = 0; app < appsConnected.length; app++) {
          for (phone = 0; phone < listOfPhones.length; phone++) {
            if (appsConnected[app].phoneid === listOfPhones[phone].phoneId) {
              //Envia respues a todos los celulares conectados actualmente que pertenecen al kit
              appsConnected[app].socket.emit('alertresponseconfirm', {
                [kitId]: {
                    "kitName": "Nombre kit 1",
                    "kitStatus": "bien",
                    "sensor": {
                        "k1000s1": {
                            "nombre": "Sensor 1 del  kit 1",
                            "status": "bien"
                        },
                        "k1000s2": {
                            "nombre": "Sensor 2 del kit 1",
                            "status": "bien"
                        }
                    }
                }
              });
            }
          }
        }
      }
      //AQUI VA LO QUE PASA SI LA ALERTA ES VERDADERA
      //Actualiza el estado de los kits
      for (kit = 0; kit < kitsConnected.length; kit++) {
        if (kitsConnected[kit].kitId === kitId) {
          //En caso que sea una alerta false
          if (response === "falso") {
            kitsConnected[kit].socket.emit('responsefromserverfalse', response);
          }
          //En caso que sea una alerta verdadera
          else {
            kitsConnected[kit].socket.emit('responsefromservertrue', response);
          }
          //console.log('ALERT SENDED TO ', kitsConnected[i].socket.id);
        }
      }
    });

    //QR enviado desde app (nuevo kit agragado a app)
    //TODO: Usa facker
    socket.on('qr', async function(data) {
      //Añade el celular a un kit
      await kitsController.addPhoneToKit(data);
      //Busca los kits del celular
      const kitsFromPhone = await kitsController.kitsFromPhone(data.phoneId);
      if(kitsFromPhone.length === 0){
        socket.emit('allkitsstatus', {"elements": false});
      }else{
        //Crea la lista de los kits para enviar
        kitsList = {};
        for(kit = 0; kit < kitsFromPhone.length; kit++){
          Object.assign(kitsList, {
            [kitsFromPhone[kit].kitId]: {
                "kitName": 'Nombre kit 1',
                "kitStatus": kitsFromPhone[kit].kitStatus,
                "sensor": {
                    "k1000s1": {
                        "nombre": 'Sensor 1 del  kit 1',
                        "status": 'bien'
                    },
                    "k1000s2": {
                        "nombre": 'Sensor 2 del kit 1',
                        "status": 'bien'
                    }
                }
            }
          });
        }
        socket.emit('allkitsstatus', {
          "elements": true,
          kitsList
        });
      }
    });

    //Se desconecta un socket
    socket.on('disconnect', function() {
      for (app = 0; app < appsConnected.length; app++) {
        if (appsConnected[app].socket.id === socket.id) {
          appsConnected.splice(app, 1);
        }
      }
      for (kit = 0; kit < kitsConnected.length; kit++) {
        if (kitsConnected[kit].socket.id === socket.id) {
          kitsConnected.splice(kit, 1);
        }
      }
      console.log("Hay: " + appsConnected.length + " celulares conectados");
      console.log("Hay: " + kitsConnected.length + " kits conectados");
    });

  });

}

module.exports ={
  socket
}
