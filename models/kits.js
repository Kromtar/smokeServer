const mongoose = require('mongoose');
const { Schema } = mongoose;

const sensorKitSchema = new Schema({
  kitId: String,
  kitName: String,
  kitStatus: String,
  sensor: { type: Schema.Types.ObjectId, ref: 'sensors' },
  phonesSubs: [String]
});

mongoose.model('sensorsKits', sensorKitSchema);
