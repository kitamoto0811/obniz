import Obniz from "../../../obniz";
import ObnizPartsInterface, { ObnizPartsInfo } from "../../../obniz/ObnizPartsInterface";
export interface MQ9Options {
}
declare class MQ9 implements ObnizPartsInterface {
    static info(): ObnizPartsInfo;
    keys: string[];
    requiredKeys: string[];
    onchangeanalog: any;
    onchangedigital: any;
    onexceedvoltage: any;
    voltageLimit: any;
    obniz: Obniz;
    vcc: any;
    params: any;
    gnd: any;
    ad: any;
    do: any;
    constructor();
    wired(obniz: Obniz): void;
    startHeating(): void;
    heatWait(seconds: any): Promise<unknown>;
}
export default MQ9;
