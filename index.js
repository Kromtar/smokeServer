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
var kitId = 1;
var kitName = 'Test1';
var userId = 1;


var UserIdList = [];
var UserSocketIdList = [];
var KitIdList = [];
var KitSocketList = [];

var kitData = {
 "a1234": {
    "kitName": "Test1",
    "kitStatus": "bien",

    "sensor": {

      "a11234": {
        "nombre": "Cosina",
        "status": "bien"
      },

      "a11235": {
        "nombre": "Dormitorio",
        "status": "bien"
      }
    }
  }
}



io.on('connection', function(socket) {
    console.log('Client connected, ID = ', socket.id);

    //Cuando ingresa una app, envia su id, y se agrega a 2 arrays que siempre estan juntos, cuando se ingresa algo a uno, el otro tiene el mismo index
    socket.on('applogin', function(data) {
        console.log('AppLogin request ', socket.id);
        UserIdList.push(data);
        UserSocketList.push(socket);

    });
        socket.on('loginsensorkit', function(data) {
        console.log('loginsensorkit request ',data);
        KitIdList.push(data);
        KitSocketList.push(socket);

    });

    //El detector de humo envia una alerta y el servidor revisa sus sockets para ver si esta la app online y envia una alerta, de lo contrario solo lo archiva
    socket.on('alertfromsensor', function(data) {
        console.log('ALERT request ', socket.id, 'Data =', data);
        if (data === kitId) {
            kitData.kitstatus = "mal";
            //Ingresar AQUI la alerta a la base de datos (WIP)
            //Ademas, buscar con la id del kit, el id del usuario

            for (i = 0; i < UserIdList.length; i++) {
                if (UserIdList[i] === userId) {
                    io.to(UserSocketList[i]).emit('alert', kitData);
                    console.log('ALERT SENDED TO ', UserSocketList[i]);
                }
            }
        } else {
            kitData.kitstatus = "bien";
        }
    });

    //La aplicacion revisa el estado de sus sensores
    socket.on('allkitsstatus', function(data) {
        console.log('kitstatus request ', socket.id);
        //Necesita Ciclo For (revisar la base de datos)
        if (userId === data) {
            console.log('ESTADO DE LA ALERTA:', kitData.kitstatus);
            socket.emit('kitstatus', kitData);
        }

    });

    socket.on('alertresponseconfirm', function(data) {
        if (data === userId) {
            kitData.kitstatus = 'bien';
            console.log('ESTADO DE LA ALERTA:', kitData.a1234.kitStatus);

            socket.emit('kitstatus', kitData);
            for (i = 0; i < KitIdList.length; i++) {
                if (KitIdList[i] === kitId) {
                    io.to(KitSocketList[i]).emit('alert', kitData);
                    console.log('ALERT SENDED TO ', KitSocketList[i]);
                }
            }
        }
    });


    //Listening to 'qr'
    socket.on('qr', function(data) {
        console.log(data);
    });
    // Listening to 'alertResponse' and if body === false change it to normal1
    socket.on('alertresponse', function(data) {
        console.log(data);
        if (data.response == false) {
            status = 'NORMAL';
        }
    });

    socket.on('disconnect', function() {
        for (i = 0; i < UserSocketList.length; i++) {
            if (UserSocketList[i] === socket.id) {
                UserSocketList.splice(i, 1);
                UserIdList.splice(i, 1);
            }
        }
        for (i = 0; i < KitSocketList.length; i++) {
            if (KitSocketList[i] === socket.id) {
                KitSocketList.splice(i, 1);
                KitIdList.splice(i, 1);
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