const { sendPushNotification } = require('./pushNotifications');
const kitsController = require('../dbControllers/kits');
const { callPhone } = require('./twilio');

function socket(server) {
    const io = require('socket.io')(server);

    appsConnected = [];
    kitsConnected = [];

    //Al ejecutarse una coneccion de socket.io
    io.on('connection', function(socket) {

        /*Registro de aplicaciones conectadas
		 *
		 *La aplicacion ingresa por el socket con "applogin". 
		 *El usuario entrega su id y este se pone junto a su socket en una lista,
		 *esto sirve para saber en que socket esta conectado cada usuario para enviarle informacion.
         */

        socket.on('applogin', function(data) {
            appsConnected.push({
                phoneid: data.phoneid,
                socket
            });
		});

        /*Registro de kits conectados
        *
        *Los kits ingresan por el socket con "loginsensorkit".
        *El kit entrega su id y este se pone junto a su socket en una lista,
        *esto sirve para saber en que socket esta conectado cada usuario para enviarle informacion.
        */
        socket.on('loginsensorkit', async function(data) {
            await kitsController.addNewKit(data);
            kitsConnected.push({
                kitId: data.kitId,
                socket
            });    
        });

        /*Update del estatus de los kits
		*
		*El kit envia informacion del estado de sus componentes.
		*Se ingresa esta informacion a la base de datos
		*	
        */
        //TODO: ???
        socket.on('kitupdatestatus', async function(data) {
            await kitsController.updateKit(Object.keys(data)[0], data[Object.keys(data)[0]]);
        });

        /*Alerta desde el kit
		*
		*El kit registra un problema (alerta de humo) y envia su informacion.
		*Se ingresa la informacion a la base de datos y se busca a el/los usuarios de este kit,
		*finalmente se envia una alerta a la aplicacion asociada a estos usuarios.
        */
        socket.on('alertfromsensor', async function(data) {

            //Actualiza el estado del kit en la DB
            const kitId = Object.keys(data)[0];
            const dataOfKit = data[Object.keys(data)[0]];
            await kitsController.updateKit(kitId, dataOfKit);
            //Busca los usuarios registrados a ese kit
            let listOfPhones = await kitsController.phonesFromKit(kitId);
            //Busca cuales de esos usuarios estan conectados actualmente
            for (app = 0; app < appsConnected.length; app++) {
                for (phone = 0; phone < listOfPhones.length; phone++) {
                    if (appsConnected[app].phoneid === listOfPhones[phone].phoneId) {
                        //Envia alerta a usuarios conectados actualemente
                        appsConnected[app].socket.emit('alert', { data });
                    }
                }
            }
            //Registra los tokes de la push notifications de los usuarios registrados al kit
            expoTokens = [];
            for (phone = 0; phone < listOfPhones.length; phone++) {
                expoTokens.push(listOfPhones[phone].phonePushToken);
            }
            //Envia las pushnotification mediante el manejador de EXPO
            await sendPushNotification(expoTokens, data);
            //Realiza una llamada al primer celular registrado al kit
            //TODO: Que se llame a todos los celulares
            if (listOfPhones[0].phoneNumber !== '') {
                callPhone(listOfPhones[0].phoneNumber);
            }
        });



        /*Revisa los Kits de un usuario
         *
         *revisa si existe un kit para el usuario que pregunto, si no existe se envia un estado falso
         *de existir, se retorna la lista de los Kits a la applicacion
         */
        //TODO: Se esta usando faker
        //TODO: Remover elements, refactor app

        socket.on('checkallstatus', async function(data) {

            const kitsFromPhone = await kitsController.kitsFromPhone(data.phoneId);
            if (kitsFromPhone.length === 0) {
                socket.emit('allkitsstatus', { "elements": false });
            } else {

                kitsList = {}; //Crea la lista de los kits para enviar

                for (kit = 0; kit < kitsFromPhone.length; kit++) {
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

        /*Respuesta a la alerta desde una app
         *
         *Si existe una alerta en la aplicacion, esta envia data aqui.
         *Se revisa si alguien constesto, de no ser asi se envia una alerta a todos los usuarios registrados al kit.
         *Cuando se contesta la alerta finalmente, se actualiza el estado de los kits
         *con alerta verdadera o falsa en cada caso.
         */
        //TODO: Usa faker
        //TODO: Añadir que pasa cuando es verdadero
        socket.on('alertresponse', async function(data) {

            const { response, kitId } = data;

            if (response === "falso") {
                //Se actualiza el estado del kit en la DB
                await kitsController.updateKit(kitId, { kitStatus: "bien" });
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
            //ALERTA = VERDADERO
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
                }
            }
        });

        /*QR enviado desde app (nuevo kit agragado a app)
		*
		*La aplicacion ingresa un codigo QR, el cual contiene informacion de el kit de ese usuario.
        *Luego se vincula a esta aplicacion con el kit encontrado en el codigo QR,
        *ingresando todo esto a la Base de Datos.
        */
        //TODO: Usa faker
        socket.on('qr', async function(data) {
            //Añade el celular a un kit
            await kitsController.addPhoneToKit(data);
            //Busca los kits del celular
            const kitsFromPhone = await kitsController.kitsFromPhone(data.phoneId);
            if (kitsFromPhone.length === 0) {
                socket.emit('allkitsstatus', { "elements": false });
            } else {
                //Crea la lista de los kits para enviar
                kitsList = {};
                for (kit = 0; kit < kitsFromPhone.length; kit++) {
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

        /*Se desconecta un socket
        *
        *Cuando se desconecta un usuario, ya sea de kit o applicacion,
        *este es removido de su lista respectiva (ID-Socket).
        */
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

        });

    });

}

module.exports = {
    socket
}