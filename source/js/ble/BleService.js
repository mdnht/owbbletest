import {BleGattClientControl} from './BleGattClientControl';

export class BleService{
  constructor($log, $timout){

    this.REGISTER_UUID = "";

    this.$log = $log;
    this.$timeout = $timeout;

    let bleControl = BleGattClientControl.getInstance();

    this.bluetoothManager = bleControl.getBluetooth();
    this.bleManager = bleControl.getBleGatt();
    this.settingManager = bleControl.getSetting();


    this.searchTimer = undefined;
    this.scaning = false;
    this.defaultAdapter = null;
    this.service_scaning = false;
    this.rssi_timer = undefined;

    this.devices = [];
    this.services = [];
    this.descriptors = [];
    this.charactoristics = [];


    this.client_if;
    this.server_if;
    this.bd_addr;

    this.regist_uuid;
    this.conn_id;

    this.select_srvc_id;
    this.select_char_id;
    this.select_descr_id;

    this.start_incl_srvc_id = {
        uuid: "",
        inst_id: ""
    };
    this.start_char_id = {
        uuid: "",
        inst_id: "",
        is_primary: ""
    };
    this.start_descr_id = {
        uuid: "",
        inst_id: ""
    };

    this.auth_req = 0;
    this.write_type = 2;
    this.front_page = -1;
    this.isnotify = false;
    this.des_value = null;

    //
    this.bluetoothManager.onenabled = this._registerCallback;
    this.bluetoothManager.ondisabled = ()=>{
        this.$log.debug("bluetooth disabled");
        this.defaultAdapter = null;
    };

    let req = this.settingManager.createLock().get('bluetooth.enabled');
    req.onsuccess = ()=>{
        var enabled = req.result['bluetooth.enabled'];
        this.$log.debug("bluetooth enabled:" + enabled);
        if (enabled) {
            this._registerCallback();
        } else {
            alert("Bluetooth will be opened");
            this.settingManager.createLock().set({
                'bluetooth.enabled': true
            });
        }
    };
  }

  //　コールバック登録
  _registerCallback(){
    this.$log.debug("registerCallback");
    this.defaultAdapter = null;
    let req = this.bluetoothManager.getDefaultAdapter();
    req.onsuccess = ()=>{
        this.defaultAdapter = req.result;
        if (this.defaultAdapter != null) {
            this.$log.debug("defaultAdapter:" + this.defaultAdapter.name);
            this.defaultAdapter.onregisterclient = this._onRegisterClient;
            this.defaultAdapter.onscanresult = this._onScanResult;
            this.defaultAdapter.onconnectble = this._onConnectble;
            this.defaultAdapter.ondisconnectble = this._onDisconnectble;
            this.defaultAdapter.onsearchcomplete = this._onSearchComplete;
            this.defaultAdapter.onsearchresult = this._onSearchResult;
            this.defaultAdapter.ongetcharacteristic = this._onGetCharacteristic;
            this.defaultAdapter.ongetdescriptor = this._onGetDescriptor;
            this.defaultAdapter.ongetIncludedservice = this._onGetIncludedService;
            this.defaultAdapter.onregisterfornotification = this._onRegisterforNotification;
            this.defaultAdapter.onnotify = this._onNotify;
            this.defaultAdapter.onreadcharacteristic = this._onReadCharacteristic;
            this.defaultAdapter.onwritecharacteristic = this._onWriteCharacteristic;
            this.defaultAdapter.onreaddescriptor = this._onReadDescriptor;
            this.defaultAdapter.onwritedescriptor = this._onWriteDescriptor;
            this.defaultAdapter.onexecuteWrite = this._onExecutWrite;
            this.defaultAdapter.onreadremoterssi = this._onReadRemoterssi;
            this.defaultAdapter.onblelisten = this._onBleListen;

            if (this.bleManager) {
                this.bleManager.registerClient(REGISTER_UUID);
            }
        } else {
            this.$log.warning('bluetooth adapter is null');
        }
    };
    req.onerror = ()=>{
        this.$log.debug('Can not get bluetooth adapter!');
    };
  }

  //　デバイススキャン
  scanDevices(){
    this.$log.log("scanDevices");
    if (this.scaning) {
            return;
        }

        //showSearching(true);
        //$("#device_list li").remove();
        this.scaning = true;
        this.bleManager.scanLEDevice(client_if, true);
        this.searchTimer = this.$timeout(()=>{
            this.bleManager.scanLEDevice(client_if, false);
            clearTimeout(searchTimer);
            this.searchTimer = undefined;
            this.scaning = false;
            //showSearching(false);
        }, 10000);
  }

  //　serviceを検索
  /*searchServices(){
    this.service_scaning = true;
    this.bleManager.searchService(this.conn_id, '');
  }*/

  connectDevice(address){
    this.bleManager.connectBle(this.client_if, address, true);
    this.bd_addr = device.address;
  }

  selectService(serviceId){
    this.select_srvc_id = service;
    this.bleManager.getIncludeService(this.conn_id, this.select_srvc_id, this.start_incl_srvc_id);
    start_char_id = {
        uuid: "",
        inst_id: "",
        is_primary: ""
    };
    this.bleManager.getCharacteristic(conn_id, this.select_srvc_id, start_char_id);
  }

  //　read charactoristics
  readCharactoristics(charId){

  }

  //　write charactoristics
  writeCharactoristics(charId, value){

  }

  //　read descriptor
  readDescriptor(descriptorId){

  }

  //　write descriptor
  writeDescriptor(descriptorId, value){

  }



  //　onRegisterClient
  _onRegisterClient(event){
    this.$log.debug("register status:" + event.status);
    this.$log.debug("register client_if:" + event.client_if);
    this.$log.debug("register uuid:" + event.uuid);
    if (event.status == 0) {
      this.regist_uuid = event.uuid;
      this.client_if = event.client_if;
      // 登録成功！
    }
  }

  //スキャン結果
  _onScenResutl(event){
    this.$log.debug("onScanResult:" + event.bda);
    let device = {
        name : event.adv_data,
        address : event.bda,
        rssi : event.rssi,
        type : event.device_type
    };
    this._addDevice(device);
  }

  // BLEと接続
  _onConnectBle(event){
    this.$log.debug("connectble status:" + event.status);
    this.$log.debug("connectble conn_id:" + event.conn_id);
    if (event.status === 0) {
        //$('#connect_state').html('SearchService...');
        this.conn_id = event.conn_id;
        //$("#service_list li").remove();
        this.service_scaning = true;
        this.bleManager.searchService(conn_id, '');
        if (!this.rssi_timer) {
            this.rssi_timer = setInterval(()=>{
                bleManager.readRemoteRssi(client_if, this.bd_addr);
            }, 5000);
        }
    }
  }

  // BLEと切断
  _onDisconnectBle(event){
    this.$log.debug("disconnectble status:" + event.status);
    if (event.status == 0) {
        clearInterval(rssi_timer);
        this.rssi_timer = undefined;
        //front_page = 0;
        this.conn_id = undefined;
        // $('#connect_state').html('disconnected');
        /*showCharacteristic(false);
        showCharacteristicList(false);
        showDescriptor(false);
        showDescriptorList(false);
        showServiceList(false);*/
    }
        //$('#path').html('');
  }

  //
  _onSearchComplete(event){
    this.$log.debug("onSearchComplete status:" + event.status);
        service_scaning = false;
  }

  //
  _onSearchResult(event){
    //$('#connect_state').html('Connected');
    this.$log.debug("onSearchResult:" + event);
    this.$log.debug("srvc_id_id_uuid:" + event.srvc_id_id_uuid);
    this.$log.debug("srvc_id_id_inst_id:" + event.srvc_id_id_inst_id);
    this.$log.debug("srvc_id_is_primary:" + event.srvc_id_is_primary);
    var srvc_id = {
        uuid: event.srvc_id_id_uuid,
        inst_id: event.srvc_id_id_inst_id,
        is_primary: event.srvc_id_is_primary
    };
    //front_page = 1;
    this._addService(srvc_id);
    //showServiceList(true);
  }

  //
  _onGetCharactoristics(event){
    this.$log.debug("onGetCharacteristic:" + event);
    this.$log.debug("state:" + event.status);
    this.$log.debug("char_id_uuid:" + event.char_id_uuid);
    this.$log.debug("char_id_inst_id:" + event.char_id_inst_id);
    this.$log.debug("char_prop:" + event.char_prop);

    var char_id = {
        uuid: event.char_id_uuid,
        inst_id: event.char_id_inst_id
    };

    var characteristic = {
        uuid: event.char_id_uuid,
        inst_id: event.char_id_inst_id,
        prop: event.char_prop
    };
    addCharacteristic(characteristic, char_id);
    showCharacteristicList(true);
  }

  //
  _onGetDiscriptor(event){
    this.$log.debug("descr_status:" + event.status);
    this.$log.debug("descr_id_uuid:" + event.descr_id_uuid);
    this.$log.debug("descr_id_inst_id:"  + event.descr_id_inst_id);

    if (event.status != 0) {
        return;
    }
    var descr_id = {
        uuid: event.descr_id_uuid,
        inst_id: event.descr_id_inst_id
    };
    addDescriptor(descr_id, descr_id);
  }

  //
  _onGetIncludedService(event){
    this.$log.debug("onGetIncludedService:" + event);
    this.$log.debug("incl_srvc_id_id_uuid:" + event.incl_srvc_id_id_uuid);
    this.$log.debug("incl_srvc_id_id_inst_id:" + event.incl_srvc_id_id_inst_id);
    this.$log.debug("incl_srvc_id_is_primary:" + event.incl_srvc_id_is_primary);
  }

  //
  _onNotify(event) {
      this.$log.debug("onNotify value:" + event.value);
      this.$log.debug("onNotify bda:" + event.bda);
      this.$log.debug("onNotify srvc_id_id_uuid:" + event.srvc_id_id_uuid);
      this.$log.debug("onNotify srvc_id_id_inst_id:" + event.srvc_id_id_inst_id);
      this.$log.debug("onNotify srvc_id_is_primary:" + event.srvc_id_is_primary);
      this.$log.debug("onNotify char_id_uuid:" + event.char_id_uuid);
      this.$log.debug("onNotify char_id_inst_id:" + event.char_id_inst_id);
      this.$log.debug("onNotify len:" + event.len);
      this.$log.debug("onNotify is_notify:" + event.is_notify);
      $('#notify').html(event.value);
    }

    _onReadCharacteristic(event) {
      this.$log.debug("onReadCharacteristic status:" + event.status);
      this.$log.debug("onReadCharacteristic value:" + event.value);
      this.$log.debug("value_type:" + event.value_type);
      var value = event.value;
      $('#char_read_data').html(value);

    }

    _onWriteCharacteristic(event) {
      this.$log.debug("onWriteCharacteristic status:" + event.status);
      bleManager.executeWrite(conn_id, 0);
    }

    _onReadDescriptor(event) {
      this.$log.debug("onReadDescriptor:" + event.value);
      des_value = event.value;
      this.$log.debug("start writeDescriptor  select_srvc_id ::" + " : " + select_srvc_id.uuid);
      this.$log.debug("start writeDescriptor  select_char_id ::" + " : " + select_char_id.uuid);
      this.$log.debug("start writeDescriptor  select_descr_id::" + " : " + select_descr_id.uuid);
      $('#des_read_data').html(des_value);
    }

    _onWriteDescriptor(event) {
      this.$log.debug("onWriteDescriptor status:" + event.status);
      bleManager.executeWrite(conn_id, 0);
    }

    _onExecutWrite(event) {
      this.$log.debug("onExecutWrite status:" + event.status);
    }

    _onReadRemoterssi(event) {
      $('#device_rssi').html(event.rssi);
    }

    _onBleListen(event) {
      this.$log.debug("onBleListen:" + event.status);
      this.$log.debug("onBleListen:" + event.server_if);
      server_if = event.server_if;
    }


    //data
    _addDevice(device){
      this.devices.push(device);
    }

    _addService(service){
      this.services.push(service);
    }

    _addDescriptor(descriptor)
    {
      this.descriptors.push(descriptor);
    }

    _addCharactoristics(charactoristic)
    {
      this.charactoristics.push(charactoristic);
    }




}
