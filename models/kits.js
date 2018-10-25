const mongoose = require('mongoose');
const { Schema } = mongoose;

const phonesSchema = new Schema({
  phoneId: String,
  phonePushToken: String,
});

const kitsSchema = new Schema({
  kitId: String,
  phonesSubs: [phonesSchema]
});

mongoose.model('kits', kitsSchema);
mongoose.model('phones', phonesSchema);
