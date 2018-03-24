/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * 
 * @param {type} rawData
 * @return {BleRemotePeripheral}
 */
class BleRemotePeripheral {

  constructor(Obniz, address){
    this.Obniz = Obniz;
    this.address = address;
    
    this.keys = [
      "device_type",
      "address_type",
      "ble_event_type",
      "rssi",
      "adv_data",
      "scan_resp",
    ];
    
    this.services = [];
  }

/**
 * 
 * @return {String} json value
 */
  toString() {
    return JSON.stringify({
      id: this.id,
      address: this.address,
      addressType: this.addressType,
      connectable: this.connectable,
      advertisement: this.adv_data,
      scanResponse: this.scan_resp,
      rssi: this.rssi,
      state: this.state
    });
  }

  setParams(dic) {
    for(var key in dic){
      if(this.keys.includes(key)){
        this[key] = dic[key] ;
      }
    }
  }

  analyseAdvertisement() {
    if (!this.advertise_data_rows) {
      this.advertise_data_rows = [];
      if (this.adv_data) {
        for (var i = 0; i < this.adv_data.length; i++) {
          var length = this.adv_data[i];
          var arr = new Array(length);
          for (var j = 0; j < length; j++) {
            arr[j] = this.adv_data[i + j + 1];
          }
          this.advertise_data_rows.push(arr);
          i = i + length;
        }
      }
      if (this.scan_resp) {
  
        for (var i = 0; i < this.scan_resp.length; i++) {
          var length = this.scan_resp[i];
          var arr = new Array(length);
          for (var j = 0; j < length; j++) {
            arr[j] = this.scan_resp[i + j + 1];
          }
          this.advertise_data_rows.push(arr);
          i = i + length;
        }
      }
    }
  }


  serarchTypeVal(type){
    this.analyseAdvertisement();
    for(var i = 0;i<this.advertise_data_rows.length;i++){
      if(this.advertise_data_rows[i][0] === type){
        var results = [].concat(this.advertise_data_rows[i]);
        results.shift();
        return results;
      }
    }
    return undefined;
  }

  localName(){
    var data = this.serarchTypeVal(0x09);
    if(!data){
       data = this.serarchTypeVal(0x08);
    }
    if(!data)return null;
    return String.fromCharCode.apply(null, data);
  }

  iBeacon(){
    var data = this.serarchTypeVal(0xFF);
    if(!data 
        || data[0] !== 0x4c
        || data[1] !== 0x00
        || data[2] !== 0x02
        || data[3] !== 0x15 
        || data.length !== 25)return null;
    
    var uuidData = data.slice(4, 20);
    var uuid = "";
    for(var i = 0; i< uuidData.length;i++){
      uuid = uuid + (( '00' + uuidData[i].toString(16) ).slice( -2 ));
      if(i === (4-1) ||i === (4+2-1) ||i === (4+2*2-1) ||i === (4+2*3-1) ){
        uuid += "-";
      }
    }
    
    var major = (data[20]<<8) + data[21];
    var minor = (data[22]<<8) + data[23];
    var power = data[24];
    
    return {
      uuid : uuid,
      major: major,
      minor :minor,
      power :power,
      rssi :this.rssi
    };
  }

  connect(callbacks){
    var keys = ["onconnect","ondisconnect"];
    this.setParams(keys, callbacks);
    
    var obj = {
      "ble" :{
        "connect" :{
          "address" : this.address
        }
      }
    };
    this.Obniz.send(obj);
  }

  disconnect(){
    var obj = {
      "ble" :{
        "disconnect" :{
          "address" : this.address
        }
      }
    };
    this.Obniz.send(obj); 
  }

  updateRssi(){
    throw new Error("todo");
  }

  getService(uuid){
    for(var key in this.services){
      if(this.services[key].uuid === uuid){
        return this.services[key];
      }
    }
    var newService = new BleRemoteService(this.Obniz,this, uuid);
    this.services.push(newService);
    return newService;
  }

  discoverAllServices(){
    var obj = {
      "ble" :{
        "get_services" :{
          "address" : this.address
        }
      }
    };
    this.Obniz.send(obj);
  }

  onconnect(){};
  ondisconnect(){};
  ondiscoverservice(service){};

  onerror(err){};

}


/**
 * 
 * @param {type} Obniz
 * @param {type} peripheral
 * @param {type} uuid
 * @return {BleRemoteService}
 */

class BleRemoteService {

  constructor(Obniz, peripheral, uuid){
    this.Obniz = Obniz;
    this.uuid = uuid;
    this.peripheral = peripheral;
    
    this.characteristics = [];
  }

  toString(){
    return JSON.stringify({
          "address" : this.peripheral.address,
          "service_uuid" : this.uuid
    });
  }

  discoverAllCharacteristics(){
    var obj = {
      "ble" :{
        "get_characteristics" :{
          "address" : this.peripheral.address,
          "service_uuid" : this.uuid
        }
      }
    };
    this.Obniz.send(obj);
  }

  getCharacteristic(uuid){
  
    for(var key in this.characteristics){
      if(this.characteristics[key].uuid === uuid){
        return this.characteristics[key];
      }
    }
    var newCharacteristic = new BleRemoteCharacteristic(this.Obniz, this, uuid);
    this.characteristics.push(newCharacteristic);
    return newCharacteristic;
  }


  ondiscovercharacteristic( characteristic){};

}


/**
 * 
 * @param {type} Obniz
 * @param {type} service
 * @param {type} uuid
 * @return {BleRemoteCharacteristic}
 */

class BleRemoteCharacteristic {

  constructor(Obniz, service, uuid){
    this.Obniz = Obniz;
    this.service = service;
    this.uuid = uuid;
    this.descriptors = [];
  }

  toString(){
    return JSON.stringify({
          "address" : this.service.peripheral.address,
          "service_uuid" : this.service.uuid,
          "characteristic_uuid" : this.uuid
        });
  }

  read(){
    var obj = {
      "ble" :{
        "read_characteristic" :{
          "address" : this.service.peripheral.address,
          "service_uuid" : this.service.uuid,
          "characteristic_uuid" : this.uuid
        }
      }
    };
    this.Obniz.send(obj);
  }

  async readWait(){
    throw new Error("TODO");
  }

  write(array){
    var obj = {
      "ble" :{
        "write_characteristic" :{
          "address" : this.service.peripheral.address,
          "service_uuid" : this.service.uuid,
          "characteristic_uuid" : this.uuid,
          "data" : array
        }
      }
    };
    this.Obniz.send(obj);
  }

  writeNumber(val){
    var obj = {
      "ble" :{
        "write_characteristic" :{
          "address" : this.service.peripheral.address,
          "service_uuid" : this.service.uuid,
          "characteristic_uuid" : this.uuid,
          "value" : val
        }
      }
    };
    this.Obniz.send(obj);
  }

  writeText(str){
    var obj = {
      "ble" :{
        "write_characteristic" :{
          "address" : this.service.peripheral.address,
          "service_uuid" : this.service.uuid,
          "characteristic_uuid" : this.uuid,
          "text" : str
        }
      }
    };
    this.Obniz.send(obj);
  }

  discoverAllDescriptors(str){
    var obj = {
      "ble" :{
        "get_descriptors" :{
          "address" : this.service.peripheral.address,
          "service_uuid" : this.service.uuid,
          "characteristic_uuid" : this.uuid
        }
      }
    };
    this.Obniz.send(obj);
  }

  getDescriptor(uuid){
    for(var key in this.descriptors){
      if(this.descriptors[key].uuid === uuid){
        return this.descriptors[key];
      }
    }
    var newDescriptors = new BleRemoteDescriptor(this.Obniz, this, uuid);
    this.descriptors.push(newDescriptors);
    return newDescriptors;
  }

  onwrite(status){};
  onread(value){};
  ondiscoverdescriptor(descriptor){};


}

/**
 * 
 * @param {type} Obniz
 * @param {type} characteristic
 * @param {type} uuid
 * @return {BleRemoteCharacteristic}
 */

class BleRemoteDescriptor {
  constructor(Obniz, characteristic, uuid){
    this.Obniz = Obniz;
    this.characteristic = characteristic;
    this.uuid = uuid;
  }

  toString(){
    return JSON.stringify({
      "address" : this.characteristic.service.peripheral.address,
      "service_uuid" : this.characteristic.service.uuid,
      "characteristic_uuid" : this.characteristic.uuid,
      "descriptor_uuid" : this.uuid
    });
  }

  read(){
    var obj = {
      "ble" :{
        "read_descriptor" :{
          "address" : this.characteristic.service.peripheral.address,
          "service_uuid" : this.characteristic.service.uuid,
          "characteristic_uuid" : this.characteristic.uuid,
          "descriptor_uuid" : this.uuid
        }
      }
    };
    this.Obniz.send(obj);
  }

  async readWait(){
    throw new Error("TODO");
  }

  write(array){
    var obj = {
      "ble" :{
        "write_descriptor" :{
          "address" : this.characteristic.service.peripheral.address,
          "service_uuid" : this.characteristic.service.uuid,
          "characteristic_uuid" : this.characteristic.uuid,
          "descriptor_uuid" : this.uuid,
          "data" : array
        }
      }
    };
    this.Obniz.send(obj);
  }

  onread(value){};
  onwrite(value){};
}