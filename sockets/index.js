const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const kitsController = require('../controllers/kits');

function socket(server){
  var io = require('socket.io')(server);

  appsConnected = [];
  kitsConnected = [];

  io.on('connection', function(socket) {

    socket.on('applogin', function(data) {
      appsConnected.push({
        phoneid: data.phoneid,
        socket: socket
      });
    });

    socket.on('loginsensorkit', async function(data) {
      await kitsController.addNewKit(data);
      kitsConnected.push({
        kitId: data.kitID,
        socket: socket
      });
    });

    socket.on('kitupdatestatus', async function(data){
      await kitsController.updateKit(Object.keys(data)[0], data[Object.keys(data)[0]]);
    });


    socket.on('alertfromsensor', async function(data) {
      await kitsController.updateKit(Object.keys(data)[0], data[Object.keys(data)[0]]);
      let listOfPhones = await kitsController.phonesFromKit(Object.keys(data)[0]);
      console.log(listOfPhones);
      expoTokens = [];
      for (i = 0; i < appsConnected.length; i++) {
        for (phone = 0; phone < listOfPhones.length; phone++) {
          if (appsConnected[i].phoneid === listOfPhones[phone].phoneId) {
            appsConnected[i].socket.emit('alert', {data});

            expoTokens.push(listOfPhones[phone].phonePushToken);

            console.log('ALERT SENDED TO ', appsConnected[i].socket.id);
          }
        }
      }
      let messages = [];
      for (let pushToken of expoTokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
          console.error(`Push token ${pushToken} is not a valid Expo push token`);
          continue;
        }
        messages.push({
          to: pushToken,
          sound: 'default',
          body: 'This is a test notification',
          data: { data },
        })
      }
      let chunks = expo.chunkPushNotifications(messages);
      (async () => {
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

    socket.on('checkallstatus', async function(data) {
      console.log("Buscando kits de:",data);
      const kitsFromPhone = await kitsController.kitsFromPhone(data.phoneId);
      if(kitsFromPhone.length === 0){
        socket.emit('allkitsstatus', {"elements": false});
      }else{
        console.log(kitsFromPhone[0]);
        socket.emit('allkitsstatus', {
          "elements": true,
          "kitsList": {
              [kitsFromPhone[0].kitId]: {
                  "kitName": 'Nombre kit 1',
                  "kitStatus": kitsFromPhone[0].kitStatus,
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
          }
        });
      }
    });

    socket.on('alertresponse', async function(data) {
      console.log('Alert Response From APP =', data);
      if (data.response === "falso") {
        await kitsController.updateKit(data.kitID, {kitStatus: "bien" });
        const kitStatus = await kitsController.kitStatus(data.kitID);
        let listOfPhones = await kitsController.phonesFromKit(data.kitID);
        for (i = 0; i < appsConnected.length; i++) {
          for (phone = 0; phone < listOfPhones.length; phone++) {
            if (appsConnected[i].phoneid === listOfPhones[phone].phoneId) {
              appsConnected[i].socket.emit('alertresponseconfirm', {
                [kitStatus.kitId]: {
                    "kitName": "Nombre kit 1",
                    "kitStatus": kitStatus.kitStatus,
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
      for (i = 0; i < kitsConnected.length; i++) {
        if (kitsConnected[i].kitId === data.kitID) {
          if (data.response === "falso") {
            kitsConnected[i].socket.emit('responsefromserverfalse', data.response);
          } else {
            kitsConnected[i].socket.emit('responsefromservertrue', data.response);
          }
          console.log('ALERT SENDED TO ', kitsConnected[i].socket.id);
        }
      }
    });

    socket.on('qr', async function(data) {
      console.log(data);
      await kitsController.addPhoneToKit(data);
      const kitsFromPhone = await kitsController.kitsFromPhone(data.phoneId);
      if(kitsFromPhone.length === 0){
        socket.emit('allkitsstatus', {"elements": false});
      }else{
        console.log(kitsFromPhone[0]);
        socket.emit('allkitsstatus', {
          "elements": true,
          "kitsList": {
              [kitsFromPhone[0].kitId]: {
                  "kitName": 'Nombre kit 1',
                  "kitStatus": kitsFromPhone[0].kitStatus,
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
          }
        });
      }
    });

    socket.on('disconnect', function() {
      for (i = 0; i < appsConnected.length; i++) {
        if (appsConnected[i].socket.id === socket.id) {
          appsConnected.splice(i, 1);
        }
      }
      for (i = 0; i < kitsConnected.length; i++) {
        if (kitsConnected[i].socket.id === socket.id) {
          kitsConnected.splice(i, 1);
        }
      }
      console.log('user disconnected', socket.id);
    });

  });

}

module.exports ={
  socket
}
