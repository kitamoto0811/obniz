import ObnizBLE from "./libs/embeds/ble/ble";
import ObnizBLEHci from "./libs/embeds/bleHci/ble";
import Display from "./libs/embeds/display";
import ObnizSwitch from "./libs/embeds/switch";
import PeripheralAD from "./libs/io_peripherals/ad";
import PeripheralDirective from "./libs/io_peripherals/directive";
import PeripheralI2C from "./libs/io_peripherals/i2c";
import PeripheralIO from "./libs/io_peripherals/io";
import PeripheralPWM from "./libs/io_peripherals/pwm";
import PeripheralSPI from "./libs/io_peripherals/spi";
import PeripheralUART from "./libs/io_peripherals/uart";
import LogicAnalyzer from "./libs/measurements/logicanalyzer";
import ObnizMeasure from "./libs/measurements/measure";
import ObnizParts from "./ObnizParts";
export default class ObnizComponents extends ObnizParts {
    pongObservers: any;
    _allComponentKeys: any;
    io?: PeripheralDirective;
    io0?: PeripheralIO;
    io1?: PeripheralIO;
    io2?: PeripheralIO;
    io3?: PeripheralIO;
    io4?: PeripheralIO;
    io5?: PeripheralIO;
    io6?: PeripheralIO;
    io7?: PeripheralIO;
    io8?: PeripheralIO;
    io9?: PeripheralIO;
    io10?: PeripheralIO;
    io11?: PeripheralIO;
    ad0?: PeripheralAD;
    ad1?: PeripheralAD;
    ad2?: PeripheralAD;
    ad3?: PeripheralAD;
    ad4?: PeripheralAD;
    ad5?: PeripheralAD;
    ad6?: PeripheralAD;
    ad7?: PeripheralAD;
    ad8?: PeripheralAD;
    ad9?: PeripheralAD;
    ad10?: PeripheralAD;
    ad11?: PeripheralAD;
    pwm0?: PeripheralPWM;
    pwm1?: PeripheralPWM;
    pwm2?: PeripheralPWM;
    pwm3?: PeripheralPWM;
    pwm4?: PeripheralPWM;
    pwm5?: PeripheralPWM;
    uart0?: PeripheralUART;
    uart1?: PeripheralUART;
    spi0?: PeripheralSPI;
    spi1?: PeripheralSPI;
    i2c0?: PeripheralI2C;
    logicAnalyzer?: LogicAnalyzer;
    measure?: ObnizMeasure;
    display?: Display;
    switch?: ObnizSwitch;
    ble?: ObnizBLE | ObnizBLEHci;
    constructor(id: any, options?: any);
    close(): void;
    _callOnConnect(): void;
    _prepareComponents(): void;
    _resetComponents(): void;
    notifyToModule(obj: any): void;
    handleSystemCommand(wsObj: any): void;
    addPongObserver(callback: any): void;
    removePongObserver(callback: any): void;
    setVccGnd(vcc: any, gnd: any, drive: any): void;
    getIO(io: any): PeripheralIO;
    getAD(io: any): PeripheralAD;
    _getFreePeripheralUnit(peripheral: any): any;
    getFreePwm(): PeripheralPWM;
    getFreeI2C(): PeripheralI2C;
    getI2CWithConfig(config: any): PeripheralI2C;
    getFreeSpi(): PeripheralSPI;
    getSpiWithConfig(config: any): PeripheralSPI;
    getFreeUart(): PeripheralUART;
    getFreeTcp(): any;
}
