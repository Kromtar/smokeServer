const mongoose = require('mongoose');
const { Schema } = mongoose;

const sensorSchema = new Schema({
  sensorId: String,
  nombre: String,
  status: String
});

mongoose.model('sensors', sensorSchema);
