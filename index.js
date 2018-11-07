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
