import {BleService} from './BleService';

export class BleModule{
  constructor(){
    this.init();
  }
  init(){
    let bleModule = angular.module('bleModule', []);
    bleModule.service('bleService', ['$log','$timeout',BleService]);

  }
}
new BleModule();
