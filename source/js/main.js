import {BleModule} from './ble/BleModule';

class MainApp{
  constructor(){
    this.init();
  }
  init(){
    let app = angular.module('mainApp', ['bleModule']);
    app.run(['bleService', (bleService)=>{
      bleService.scanDevices();
    }]);

  }
}
new MainApp();
