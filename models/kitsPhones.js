const mongoose = require('mongoose');
const { Schema } = mongoose;

const kitsPhonesSchema = new Schema({
  sensorId: String,
  phoneId: String,
  Token: String
});

mongoose.model('sensors', kitsPhonesSchema);
