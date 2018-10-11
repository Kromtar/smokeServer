const mongoose = require('mongoose');

const sensorsKits = mongoose.model('sensorsKits');
const sensors = mongoose.model('sensors');

//Para añadir un kit a la db
async function addKit() {
  return {};
}

//Para añadir un usuario a un kit
async function addUserToKit() {
  return {};
}

//Para cambiar el estado de un kit
async function updateKitStatus() {
  return {};
}

//Busca los kits de un usuario
async function findKitsFromUser(phoneId){
  const kits = await sensorsKits.find({phonesSubs: { $all: [phoneId] }}).populate('sensor').exec();
  //Dejar en el formato de la app
  console.log(kits);
  return kits;
}

module.exports = {
  findKitsFromUser
};
