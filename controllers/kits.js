const mongoose = require('mongoose');
const Kits = mongoose.model('kits');

//Añade un telefono a un kit
async function addPhoneToKit(data) {
  const {kitID, phoneId, phonePushToken} = data;
  try{
    //Ve si existe el kit
    const kit = await Kits.findOne({
      kitId: kitID
    });
    //Ccrea el kit
    if(!kit){
      const kit = new Kits({
        kitId: kitID,
        phonesSubs: [{
          phoneId,
          phonePushToken,
        }]
      });
      await kit.save();
    }else{
      //Ve si el telefono ya esta inscrito al kit
      const kitWhitPhoneOK = await Kits.findOne({
        kitId: kitID,
        'phonesSubs.phoneId':phoneId
      });
      //Añade el telefono al kit
      if(!kitWhitPhoneOK){
        await Kits.update(
          {kitId: kitID},
          {kitId: kitID, $push:{phonesSubs:{
            phoneId: phoneId,
            phonePushToken,
          }}}
        );
      }
    }
  } catch(err){
    console.log(err);
  }
}

//Añade un kit
async function addNewKit(data) {
  console.log(data);
  try{
    const kit = await Kits.findOne({kitId: data.kitID});
    if(!kit){
      const kit = new Kits({
        kitId: data.kitID,
      });
      const newKit = await kit.save();
      console.log("Agregado nuevo kit", newKit);
    }
  } catch(err){
    console.log('Catch', err);
  }
}

//Busca todos los telefonos de un determinado kit
async function phonesFromKit(kitID) {
  try{
    const kit = await Kits.findOne({kitId: kitID});
    return kit.phonesSubs;
  } catch(err){
    console.log('Catch', err);
  }
}

//Updatea el estado de un sensor
//TODO: Implementar sensores
async function updateKit(id,data){
  try{
    const updatedKit = await Kits.update(
      {kitId: id},
      {kitStatus: data.kitStatus}
    );
  } catch(err){
    console.log('Catch', err);
  }
}

//Busca todos los kits de un determinado telefono
async function kitsFromPhone(phoneId){
  try{
    const kits = await Kits.find({
      'phonesSubs.phoneId': phoneId
    });
    return kits;
  } catch(err){
    console.log('Catch', err);
  }
}

async function kitStatus(kitId){
  try{
    const kit = await Kits.findOne({
      kitId: kitId
    });
    return kit;
  } catch(err){
    console.log('Catch', err);
  }
}

module.exports = {
  addPhoneToKit,
  addNewKit,
  phonesFromKit,
  updateKit,
  kitsFromPhone,
  kitStatus
};
