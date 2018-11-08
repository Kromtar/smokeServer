const accountSid = process.env.TWILIOSID;
const authToken = process.env.TWILIOTOKEN;
const twilio = require('twilio');
const client = require('twilio')(accountSid, authToken);

async function callPhone(phone){
  try{
    client.calls
      .create({
         url: 'https://handler.twilio.com/twiml/EHc4c0c8e4a76db2d6b600843ec147fb3f',
         to: phone,
         from: '+56226660898'
       })
      .then(call => console.log(call.sid))
      .done();
  }catch(err){
    console.error(err);
  }
}

module.exports = {
  callPhone
}
