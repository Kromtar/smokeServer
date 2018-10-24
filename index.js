const { Expo } = require('expo-server-sdk');
var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var httpApp = express();
require('dotenv').config();
const mongoose = require('mongoose');

const expo = new Expo();
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://admin1:admin1@ds029541.mlab.com:29541/quiet-journey-37928")
    .then (db => console.log('db connected'))
    .catch (err => console.log(err));

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
var status = 'NORMAL';
//Display index.html
httpApp.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/index.html');
});
// Get end-point arduino and send Status var
httpApp.get('/arduino', function(req, res) {
    res.send(status);
});
// Post on end-point arduino and print the body, change status and emit alert
httpApp.post('/arduino', function(req, res) {
    console.log(req.body)
    status = 'ALERT'
    io.emit('alert', { msg: status });
    res.send('Llego alerta! ')
});

httpApp.post('/arduinoId1', function(req, res) {
    console.log(req.body)
    status = 'ALERT'
    io.emit('alert', { msg: status });
    res.send('Llego alerta! ')
});

httpApp.post('/debug', function(req, res) {
    status = 'NORMAL'
    res.send('Cambio status a NORMAL')
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));


/***********************************************************************SOCKET!!***********************************************************************/
/***********************************************************************SOCKET!!***********************************************************************/


//Variables de prueba antes de hacer la base de datos
var userId = 1;


var UserIdList = [];
var UserSocketList = [];
var KitIdList = [];
var KitSocketList = [];
var expoTokens = [];

var kitData = {}
var kitDataOk = {
    "k1000": {
        "kitName": "Nombre kit 1" ,
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
}

var kitInitStatus = {
    "elements": true,
    "kitsList": {
        "k1000": {
            "kitName": 'Nombre kit 1',
            "kitStatus": 'bien',
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
        },
        "k2000": {
            "kitName": 'Nombre kit 2',
            "kitStatus": 'bien',
            "sensor": {
                "k2000s1": {
                    "nombre": 'Sensor 1 del  kit 2',
                    "status": 'bien'
                }
            }
        }
    }
}

io.on('connection', function(socket) {
    console.log('Client connected, ID = ', socket.id);

    //Cuando ingresa una app, envia su id, y se agrega a 2 arrays que siempre estan juntos, cuando se ingresa algo a uno, el otro tiene el mismo index
    socket.on('applogin', function(data) {
        console.log('AppLogin request ', socket.id, 'data = ', data);
        UserIdList.push(data.phoneid);
        UserSocketList.push(socket);

    for (i = 0; i < expoTokens.length; i++) {
            if (data.phoneNotification === expoTokens[i]) {
                return;
            }
        }
        expoTokens.push(data.phoneNotification);

    });
    //Misma idea de login pero aplicada a los KITs
    socket.on('loginsensorkit', function(data) {
        console.log('loginsensorkit request ', data);
        KitIdList.push(data.kitID);
        KitSocketList.push(socket);

  

    });


    //El detector de humo envia una alerta y el servidor revisa sus sockets para ver si esta la app online y envia una alerta, de lo contrario solo lo archiva
    socket.on('alertfromsensor', function(data) {
        console.log('ALERT request ', socket.id, 'Data =', data);

        //Ingresar AQUI la alerta a la base de datos (WIP)
        //Ademas, buscar con la id del kit, el id del usuario
        kitData = data;

        for (i = 0; i < UserIdList.length; i++) {
            if (UserIdList[i] === userId) {
                UserSocketList[i].emit('alert', kitData);
                console.log('ALERT SENDED TO ', UserSocketList[i].id);
            }
        }

    });

    //La aplicacion revisa la base de datos para saber si hay alertas
    socket.on('checkallstatus', function(data) {
        socket.emit('allkitsstatus', kitInitStatus)
    });

    //La apliicacion envia una respuesta a la alerta
    //si es positiva se envia solo al detector de humo
    //si es negativa se envia al detector de humo y devuelta a la aplicacion
    socket.on('alertresponse', function(data) {

        console.log('Alert Response From APP =', data);

        if (data.response === "falso") {
            socket.emit('alertresponseconfirm', kitDataOk);
        }

        for (i = 0; i < KitIdList.length; i++) {
            if (KitIdList[i] === data.kitID) {
                if (data.response === "falso") {
                    KitSocketList[i].emit('responsefromserverfalse', data.response);
                } else {
                    KitSocketList[i].emit('responsefromservertrue', data.response);
                }
                console.log('ALERT SENDED TO ', KitSocketList[i].id);

            }
        }
    });

    //Listening to 'qr'
    socket.on('qr', function(data) {
        console.log(data);
    });

    socket.on('disconnect', function() {
        for (i = 0; i < UserSocketList.length; i++) {
            if (UserSocketList[i].id === socket.id) {
                UserSocketList.splice(i, 1);
                UserIdList.splice(i, 1);
            }
        }
        for (i = 0; i < KitSocketList.length; i++) {
            if (KitSocketList[i].id === socket.id) {
                KitSocketList.splice(i, 1);
                KitIdList.splice(i, 1);
            }
        }
        console.log('user disconnected', socket.id);
    });


    //PUSH NOTIFICATION CODE


    socket.on('expologin', function(data) {
        for (i = 0; i < expoTokens.length; i++) {
            if (data.phoneNotification === expoTokens[i]) {
                return;
            }
        }
        expoTokens.push(data);

    });


   let messages = [];

//POR AHORA ENVIA A TODOS LOS TOKENS QUE TIENE
    socket.on('expotest', function(data) {

        for (let pushToken of expoTokens) {

if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    continue;
  }


            messages.push({
                to: pushToken,
                sound: 'default',
                body: 'This is a test notification',
                data: {data} ,
            })
        }

let chunks = expo.chunkPushNotifications(messages);
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        console.log('nani');
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log(receipts);
        messages = [];
      } catch (error) {
        console.error(error);
      }
    }
  })();

    });

});