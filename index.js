require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const httpApp = express();
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
mongoose.Promise = global.Promise;

//Importa los modelos de MongoDb
require('./models/kits');

//Crea un servidor
const server = require('http').createServer(httpApp);

//Inicia socket.io
const {socket} = require('./handlers/sockets');
socket(server);

//Control de acceso
httpApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

//Formato de consultas
httpApp.use(bodyParser.json());

//TWILIO TEST
/*
var accountSid = process.env.TWILIOSID; // Your Account SID from www.twilio.com/console
var authToken = process.env.TWILIOTOKEN;   // Your Auth Token from www.twilio.com/console
var twilio = require('twilio');
const client = require('twilio')(accountSid, authToken);
client.calls
  .create({
     url: 'https://handler.twilio.com/twiml/EHc4c0c8e4a76db2d6b600843ec147fb3f',
     to: '+56975695297',
     from: '+56226660898'
   })
  .then(call => console.log(call.sid))
  .done();
*/

//Conectando a la DB (MLab)
mongoose.connect(process.env.MONGODBURI, { useNewUrlParser: true }, (err) => {
  if (err) {
    console.log(err);
    throw err;
  } else {
    console.log('MongoDb conection OK');
    //Inicia el servidor HTTP
    server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  }
});
