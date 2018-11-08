const mongoose = require('mongoose');
const { Schema } = mongoose;

const phonesSchema = new Schema({
  phoneId: String,
  kitStatus: { type: String, default: '' },
  phoneNumber: String,
});

const kitsSchema = new Schema({
  kitId: String,
  kitStatus: { type: String, default: 'bien' },
  phonesSubs: [phonesSchema]
});

mongoose.model('kits', kitsSchema);
mongoose.model('phones', phonesSchema);
