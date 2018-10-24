const mongoose = require('mongoose');
const { Schema } = mongoose;

const kitsSensorsSchema = new Schema({
  kitId: String,
  kitName: String,
  kitStatus: String,
  sensor: { type: Schema.Types.ObjectId, ref: 'sensors' },
  phonesSubs: [String]
});

mongoose.model('sensorsKits', kitsSensorsSchema);
