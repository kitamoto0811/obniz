/* ------------------------------------------------------------------
 * node-linking - service.js
 *
 * Copyright (c) 2017, Futomi Hatano, All rights reserved.
 * Released under the MIT license
 * Date: 2017-04-15
 * ---------------------------------------------------------------- */
"use strict";
import LinkingServiceNotification from "./service-notification";
import LinkingServiceOperation from "./service-operation.js";
import LinkingServiceProperty from "./service-property.js";
import LinkingServiceSensor from "./service-sensor.js";
import LinkingServiceSetting from "./service-setting.js";

export default class LinkingService {
  public _services: any = {
    "00": new LinkingServiceProperty(),
    "01": new LinkingServiceNotification(),
    "02": new LinkingServiceOperation(),
    "03": new LinkingServiceSensor(),
    "04": new LinkingServiceSetting(),
  };

  public _write_message_name_map: any = {
    // PeripheralDevicePropertyInformation Service
    GET_DEVICE_INFORMATION: "00",
    // PeripheralDeviceNotification Service
    CONFIRM_NOTIFY_CATEGORY: "01",
    NOTIFY_INFORMATION: "01",
    // PeripheralDeviceSensorInformation Service
    GET_SENSOR_INFO: "03",
    SET_NOTIFY_SENSOR_INFO: "03",
    // PeripheralDeviceSettingOperation Service
    GET_APP_VERSION: "04",
    CONFIRM_INSTALL_APP: "04",
    GET_SETTING_INFORMATION: "04",
    GET_SETTING_NAME: "04",
    SELECT_SETTING_INFORMATION: "04",
  };

  public _device_info: any = null;

  public setDeviceInfo(device_info: any) {
    for (const code in this._services) {
      this._services[code].setDeviceInfo(device_info);
    }
    this._device_info = device_info;
  }

  public parseResponse(buf: any) {
    const service_id_hex = buf.slice(1, 2).toString("hex");
    const service = this._services[service_id_hex];
    if (!service) {
      return null;
    }
    const service_id = buf.readUInt8(1);
    const msg_id = buf.readUInt16LE(2);
    // let msg_id = buf.readUInt8(2);
    const msg_id_hex = buf.slice(2, 3).toString("hex");
    const pnum = buf.readUInt8(4);
    const payload_buf = buf.slice(5, buf.length);
    const parameters = service.parsePayload(pnum, payload_buf);

    const parsed = {
      buffer: buf,
      serviceId: service_id,
      serviceName: service.SERVICE_NAME,
      messageId: msg_id,
      messageName: service.MESSAGE_NAME_MAP[msg_id_hex],
      parameters,
    };
    return parsed;
  }

  public createRequest(message_name: any, params: any) {
    if (!(message_name in this._write_message_name_map)) {
      return null;
    }
    const sid = this._write_message_name_map[message_name];
    const service = this._services[sid];
    const buf = service.createRequest(message_name, params);
    return buf;
  }

  public isSupportedWriteMessageName(message_name: any) {
    if (!message_name) {
      return false;
    }
    let sid = this._write_message_name_map[message_name];
    if (!sid) {
      return false;
    }
    sid = parseInt(sid, 10);
    const services = this._device_info && this._device_info.services ? this._device_info.services : null;
    if (!services) {
      return false;
    }
    let res = false;
    for (const k in services) {
      if (services[k] === sid) {
        res = true;
        break;
      }
    }
    return res;
  }
}
