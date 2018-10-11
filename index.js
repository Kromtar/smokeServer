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

var kitData = {}


io.on('connection', function(socket) {
    console.log('Client connected, ID = ', socket.id);

    //Cuando ingresa una app, envia su id, y se agrega a 2 arrays que siempre estan juntos, cuando se ingresa algo a uno, el otro tiene el mismo index
    socket.on('applogin', function(data) {
        console.log('AppLogin request ', socket.id, 'data = ', data);
        UserIdList.push(data.phoneid);
        UserSocketList.push(socket);

    });
    socket.on('loginsensorkit', function(data) {
        console.log('loginsensorkit request ', data);
        KitIdList.push(data.sensorid);
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

    //La aplicacion revisa el estado de sus sensores
    socket.on('allkitsstatus', function(data) {
        console.log('kitstatus request ', socket.id);
        //Necesita Ciclo For (revisar la base de datos)
        if (userId === data.phoneid) {
            console.log('ESTADO DE LA ALERTA:', kitData.kitstatus);
            socket.emit('kitstatus', kitData);
        }

    });

    socket.on('alertresponse', function(data) {
        if (data.phoneid === userId) {

            console.log('Alert Response From APP =' data);

          /*  socket.emit('kitstatus', kitData);
            for (i = 0; i < KitIdList.length; i++) {
                if (KitIdList[i] === kitId) {
                    io.to(KitSocketList[i]).emit('alert', kitData);
                    console.log('ALERT SENDED TO ', KitSocketList[i]);
                }
            }
        */}
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
        console.log('user disconnected');
    });
});