const accountSid = process.env.TWILIOSID;
const authToken = process.env.TWILIOTOKEN;
const client = require('twilio')(accountSid, authToken);

//Manejo de la llamada de Twilio
async function callPhone(phone){
  try{
    client.calls
      .create({
         url: 'https://handler.twilio.com/twiml/EHc4c0c8e4a76db2d6b600843ec147fb3f', //Mensaje de voz configurado en la consola de twilio
         to: phone,
         from: '+56226660898' //Telefono registrado en la consola de twilio (numero chileno)
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
