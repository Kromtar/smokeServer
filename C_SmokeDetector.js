
class SmokeDetector {
  constructor(kitId, kitName, userId, numberOfSensors) {	

 	this.kitId = kitId;
 	this.kitName = kitName;
 	this.userId = userId;
 	this.numberOfSensors = numberOfSensors;
 	var status = "NORMAL";
 	var sensors = [];

 	while(numberOfSensors > 0){
 		sensors.push(numberOfSensors);
 		numberOfSensors--;
 	} 

 	
/*
   }
   //Return an object for testing purposes
   constructor(){
   	var kitId = 1;
    var kitName = "test";
    var userId = 1;
    var status = "NORMAL";

   }
*/

}
