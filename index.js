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
var statusTest = 'NORMAL';
var sensorsNames = ['Cosina', 'Garage', 'Dormitorio'];
var sensorsStatus = ['bien', 'bien', 'bien'];
var sensorsInstallation = ['bien', 'mal', 'bien'];

var UserIdList = [];
var SocketIdList = [];

io.on('connection', function(socket) {
    console.log('Client connected, ID = ', socket.id);

    //No se me ocurrio una mejor forma. Cuando ingresa una app, envia su id, y se agrega a 2 arrays que siempre estan juntos, cuando se ingresa algo a uno, el otro tiene el mismo index
    socket.on('AppLogin', function(data) {
        console.log('AppLogin request ', socket.id);
        UserIdList.push(data);
        SocketIdList.push(socket.id);

    });
    //El detector de humo envia una alerta y el servidor revisa sus sockets para ver si esta la app online y envia una alerta, de lo contrario solo lo archiva
    socket.on('AlertStatus', function(data) {
        console.log('ALERT request ', socket.id);
        if (data === kitId) {
            statusTest = 'ALERT';
            //Ingresar AQUI la alerta a la base de datos (WIP)
            //Ademas, buscar con la id del kit, el id del usuario

            for (i = 0; i < UserIdList.length; i++) {
                if (UserIdList[i] === userId) {
                    io.to(SocketIdList[i]).emit('AlertMessage', 'ALERT');
                    console.log('ALERT SENDED TO ', SocketIdList[i]);
                }
            }
        } else {
            statusTest = 'NORMAL';
        }
    });

    //La aplicacion revisa el estado de sus sensores
    socket.on('kitStatus', function(data) {
        console.log('KitStatus request ', socket.id);
        //Necesita Ciclo For (revisar la base de datos) (WIP)
        if (userId === data) {
            if (statusTest === 'ALERT') {
                //El servidor responde con una alerta de mensaje, de estado ALERT
                socket.emit('AlertMessage', 'ALERT');
                for (i = 0; i < sensorsStatus.length; i++) {
                    if (sensorsStatus[i] === 'mal') {
                        //El servidor responde con el nombre del sensor que esta en alerta
                        socket.emit('kitStatusResponse', sensorsNames[i]);
                        console.log('DETECTOR DE HUMO NUMERO: ', i);
                    }
                }
            }

        }

    });

    socket.on('alertResponseConfirm', function(data) {
        if (data === 'NORMAL') {
            statusTest = 'NORMAL';
        }
    });


    socket.on('allkitsStatus', function(data) {



    });




    //La aplicacion me envia una pregunta sobre si hay alerta y el servidor responde con ALERT o NORMAL
    socket.on('AppAlert', function(data) {
        if (userId === data) {

            if (statusTest === 'ALERT') {
                socket.emit('appIsThereAlert', 'ALERT');
            } else {
                socket.emit('appIsThereAlert', 'NORMAL');
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
        for (i = 0; i < SocketIdList.length; i++) {
            if (SocketIdList[i] === socket.id) {
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