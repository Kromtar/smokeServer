const mongoose = require('mongoose');
const Kits = mongoose.model('kits');

//Añade un telefono a un kit
async function addPhoneToKit(data) {
  const {kitID, phoneId, phonePushToken, phoneNumber} = data;
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
          phoneNumber
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
            phoneNumber
          }}}
        );
      }
    }
  } catch(err){
    console.error(err);
  }
}

//Añade un kit
async function addNewKit(data) {
  const {kitID} = data;
  try{
    //Ve si existe el kit
    const kit = await Kits.findOne({kitId: kitID});
    if(!kit){
      //Añade el kit
      const kit = new Kits({
        kitId: kitID,
      });
      await kit.save();
    }
  } catch(err){
    console.error(err);
  }
}

//Busca todos los telefonos de un determinado kit
async function phonesFromKit(kitID) {
  try{
    const kit = await Kits.findOne({kitId: kitID});
    return kit.phonesSubs;
  } catch(err){
    console.error(err);
  }
}

//Updatea el estado de un sensor
//TODO: Implementar sensores
async function updateKit(id,data){
  const {kitStatus} = data;
  try{
    await Kits.update(
      {kitId: id},
      {kitStatus}
    );
  } catch(err){
    console.error(err);
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
    console.error(err);
  }
}

//Ve el estado de un kit
async function kitStatus(kitId){
  const {kitId} = data;
  try{
    const kit = await Kits.findOne({
      kitId
    });
    return kit;
  } catch(err){
    console.error(err);
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
