/**
 * @packageDocumentation
 * @module Parts.iBS04i
 */

import Obniz from "../../../obniz";
import bleRemotePeripheral from "../../../obniz/libs/embeds/ble/bleRemotePeripheral";
import ObnizPartsInterface, { ObnizPartsInfo } from "../../../obniz/ObnizPartsInterface";

export interface IBS04IOptions {}

export interface IBS04I_Data {
  event: number;
  battery: number;
  uuid: string;
  major: number;
  minor: number;
  power: number;
  rssi: number;
}

export default class IBS04I implements ObnizPartsInterface {
  public static info(): ObnizPartsInfo {
    return {
      name: "iBS04i",
    };
  }

  public onNotification?: (data: IBS04I_Data) => void;

  public keys: string[];
  public requiredKeys: string[];
  public periperal: bleRemotePeripheral | null;
  public obniz!: Obniz;
  public params: any;

  private deviceAdv: number[] = [
    0xff,
    0x0d,
    0x00,
    0x83,
    0xbc,
    -1,
    -1,
    -1,
    0xff,
    0xff,
    0xff,
    0xff,
    0x00,
    -1,
    -1,
    -1,
    0x00,
    0x00,
  ];
  private repeat_flg: boolean = false;

  private ble_setting = {
    duplicate: true,
  };

  constructor() {
    this.keys = [];
    this.requiredKeys = [];
    this.periperal = null;
  }

  public wired(obniz: Obniz) {
    this.obniz = obniz;
  }

  public scan() {
    this.obniz.ble!.scan.onfind = (peripheral: {
      localName: string;
      advertise_data_rows: any[];
      iBeacon: { uuid: string; major: number; minor: number; rssi: number; power: number };
    }) => {
      // console.log(peripheral);
      const advertise = peripheral.advertise_data_rows.filter((adv) => {
        let find = false;
        if (this.deviceAdv.length > adv.length) {
          return find;
        }
        for (let index = 0; index < this.deviceAdv.length; index++) {
          if (this.deviceAdv[index] === -1) {
            continue;
          }
          if (adv[index] === this.deviceAdv[index]) {
            find = true;
            continue;
          }
          find = false;
          break;
        }
        return find;
      });
      if (advertise.length === 0) {
        if (peripheral.localName && peripheral.localName === "iBS04") {
          const d: IBS04I_Data = {
            battery: -1,
            event: -1,
            uuid: peripheral.iBeacon.uuid,
            major: peripheral.iBeacon.major,
            minor: peripheral.iBeacon.minor,
            power: peripheral.iBeacon.power,
            rssi: peripheral.iBeacon.rssi,
          };
          if (this.onNotification) {
            this.onNotification(d);
          }
        }
        return;
      }
      //    console.log(advertise);
      const data: IBS04I_Data = {
        battery: (advertise[0][5] + advertise[0][6] * 0xff) * 0.01,
        event: advertise[0][7],
        uuid: peripheral.iBeacon.uuid,
        major: peripheral.iBeacon.major,
        minor: peripheral.iBeacon.minor,
        power: peripheral.iBeacon.power,
        rssi: peripheral.iBeacon.rssi,
      };

      // console.log(
      //   `battery ${data.battery}V event ${data.event} uuid ${data.uuid} major ${data.major} minor ${data.minor} rssi ${data.rssi}`,
      // );
      if (this.onNotification) {
        this.onNotification(data);
      }
    };

    this.obniz.ble!.scan.onfinish = () => {
      if (this.repeat_flg) {
        this.obniz.ble!.scan.start(null, this.ble_setting);
      }
    };

    this.obniz.ble!.initWait();
    this.obniz.ble!.scan.start(null, this.ble_setting);
    this.repeat_flg = true;
  }

  public end() {
    this.repeat_flg = false;
    this.obniz.ble!.scan.end();
  }
}
