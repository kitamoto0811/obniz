"use strict";
/**
 * @packageDocumentation
 * @module ObnizCore.Components
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = __importDefault(require("../utils/util"));
/**
 * i2c can be used.
 *  Master/Slave mode.
 *  But slave mode only works with "written" events. You can't set data to be read.
 * @category Peripherals
 */
class PeripheralI2C {
    constructor(obniz, id) {
        this.Obniz = obniz;
        this.id = id;
        this._reset();
        this.onerror = undefined;
    }
    /**
     * @ignore
     * @private
     */
    _reset() {
        this.observers = [];
        this.used = false;
        this.onwritten = undefined;
    }
    /**
     * It starts i2c on given io sda, scl.
     *
     *
     * Internal pull up is optional for io output setting.
     * By default it is pull:null.
     * See more on obniz.ioX.pull().
     *
     * For using internal-pull-up, you should specify "3v" to connect to 3.3v targets, and "5v" for 5v targets.
     * When you choose internal pull up, speed is limited to up to 100khz, because internal pull up is not so tough.
     * Please add external pull-up resistor on scl/sda and choose pull:null when you need more speed.
     *
     *
     * ```javascript
     * // Javascript Example
     * obniz.i2c0.start({mode:"master", sda:2, scl:3, clock:400000});
     * obniz.i2c0.write(0x50, [0x00, 0x00, 0x12]);
     * var ret = await obniz.i2c0.readWait(0x50, 1);
     * console.log("read "+ret);
     * ```
     *
     * - use internal pull up
     *
     * ```javascript
     * obniz.i2c0.start({mode:"master", sda:2, scl:3, clock:400000, pull:"5v"});
     * ```
     *
     * - save mode
     *
     * ```javascript
     * obniz.i2c0.start({mode: "slave", sda: 0, scl: 1, slave_address: 0x01});
     * ```
     *
     * @param arg
     */
    start(arg) {
        const err = util_1.default._requiredKeys(arg, ["mode", "sda", "scl"]);
        if (err) {
            throw new Error("I2C start param '" + err + "' required, but not found ");
        }
        this.state = util_1.default._keyFilter(arg, ["mode", "sda", "scl", "pull", "gnd"]);
        const ioKeys = ["sda", "scl", "gnd"];
        for (const key of ioKeys) {
            if (this.state[key] && !this.Obniz.isValidIO(this.state[key])) {
                throw new Error("i2c start param '" + key + "' are to be valid io no");
            }
        }
        const mode = this.state.mode;
        const clock = typeof arg.clock === "number" ? Math.floor(arg.clock) : null;
        const slave_address = typeof arg.slave_address === "number" ? Math.floor(arg.slave_address) : null;
        const slave_address_length = typeof arg.slave_address_length === "number" ? Math.floor(arg.slave_address_length) : null;
        if (mode !== "master" && mode !== "slave") {
            throw new Error("i2c: invalid mode " + mode);
        }
        if (mode === "master") {
            if (clock === null) {
                throw new Error("i2c: please specify clock when master mode");
            }
            if (clock <= 0 || clock > 1 * 1000 * 1000) {
                throw new Error("i2c: invalid clock " + clock);
            }
            if (arg.pull === "5v" && clock > 400 * 1000) {
                throw new Error("i2c: please use under 400khz when internal 5v internal pull-up");
            }
            if (arg.pull === "3v" && clock > 100 * 1000) {
                throw new Error("i2c: please use under 100khz when internal 3v internal pull-up");
            }
        }
        else {
            if (slave_address === null) {
                throw new Error("i2c: please specify slave_address");
            }
            if (slave_address < 0 || slave_address > 0x7f) {
                throw new Error("i2c: invalid slave_address");
            }
            if (slave_address < 0 || slave_address > 0x7f) {
                throw new Error("i2c: invalid slave_address");
            }
            if (slave_address_length !== null && slave_address_length !== 7) {
                throw new Error("i2c: invalid slave_address_length. please specify 7");
            }
        }
        this.Obniz.getIO(this.state.sda).drive("open-drain");
        this.Obniz.getIO(this.state.scl).drive("open-drain");
        if (this.state.pull) {
            this.Obniz.getIO(this.state.sda).pull(this.state.pull);
            this.Obniz.getIO(this.state.scl).pull(this.state.pull);
        }
        else {
            this.Obniz.getIO(this.state.sda).pull(null);
            this.Obniz.getIO(this.state.scl).pull(null);
        }
        if (this.state.gnd !== undefined) {
            this.Obniz.getIO(this.state.gnd).output(false);
            const ioNames = {};
            ioNames[this.state.gnd] = "gnd";
            if (this.Obniz.display) {
                this.Obniz.display.setPinNames("i2c" + this.id, ioNames);
            }
        }
        const startObj = util_1.default._keyFilter(this.state, ["mode", "sda", "scl"]);
        if (mode === "master") {
            startObj.clock = clock;
        }
        else {
            startObj.slave_address = slave_address;
            if (slave_address_length) {
                startObj.slave_address_length = slave_address_length;
            }
        }
        const obj = {};
        obj["i2c" + this.id] = startObj;
        this.used = true;
        this.Obniz.send(obj);
    }
    /**
     * It sends data to device which has the address
     *
     * ```
     * // Javascript Example
     * obniz.i2c0.start({mode: "master",sda:2, scl:3, clock:400000, pull:null});
     * obniz.i2c0.write(0x50, [0x00, 0x00, 0x12]);
     * ```
     * @param address 7bit address only.
     * @param data Max length is 1024;
     */
    write(address, data) {
        if (!this.used) {
            throw new Error(`i2c${this.id} is not started`);
        }
        address = parseInt(address);
        if (isNaN(address)) {
            throw new Error("i2c: please specify address");
        }
        if (address < 0 || address > 0x7f) {
            throw new Error("i2c: invalid address");
        }
        if (!data) {
            throw new Error("i2c: please provide data");
        }
        if (data.length > 1024) {
            throw new Error("i2c: data should be under 1024 bytes");
        }
        const obj = {};
        obj["i2c" + this.id] = {
            address,
            data,
        };
        this.Obniz.send(obj);
    }
    /**
     * It reads data from the device. length defines the length of bytes. The treatment of address is same as write() function.
     * This function will wait until data is received.
     *
     * ```javascript
     * // Javascript Example
     * obniz.i2c0.start({mode: "master",sda:2, scl:3, clock:400000, pull:null});
     * var ret = await obniz.i2c0.readWait(0x50, 1);
     * console.log("read "+ret);
     * ```
     *
     * @param address
     * @param length Max is 1024;
     */
    readWait(address, length) {
        if (!this.used) {
            throw new Error(`i2c${this.id} is not started`);
        }
        address = parseInt(address);
        if (isNaN(address)) {
            throw new Error("i2c: please specify address");
        }
        if (address < 0 || address > 0x7f) {
            throw new Error("i2c: invalid address");
        }
        length = parseInt(length);
        if (isNaN(length) || length < 0) {
            throw new Error("i2c: invalid length to read");
        }
        if (length > 1024) {
            throw new Error("i2c: data length should be under 1024 bytes");
        }
        const self = this;
        return new Promise((resolve, reject) => {
            self.addObserver(resolve);
            const obj = {};
            obj["i2c" + self.id] = {
                address,
                read: length,
            };
            self.Obniz.send(obj);
        });
    }
    /**
     * @ignore
     * @param obj
     */
    notified(obj) {
        if (obj && typeof obj === "object") {
            if (obj.data) {
                if (obj.mode === "slave" && typeof this.onwritten === "function") {
                    this.onwritten(obj.data, obj.address);
                }
                else {
                    // TODO: we should compare byte length from sent
                    const callback = this.observers.shift();
                    if (callback) {
                        callback(obj.data);
                    }
                }
            }
            if (obj.warning) {
                this.Obniz.warning({
                    alert: "warning",
                    message: `i2c${this.id}: ${obj.warning.message}`,
                });
            }
            if (obj.error) {
                const message = `i2c${this.id}: ${obj.error.message}`;
                if (typeof this.onerror === "function") {
                    this.onerror(new Error(message));
                }
                else {
                    this.Obniz.error({
                        alert: "error",
                        message,
                    });
                }
            }
        }
    }
    /**
     * @ignore
     */
    isUsed() {
        return this.used;
    }
    /**
     * end i2c .
     *
     * ```javascript
     * // Javascript Example
     * obniz.i2c0.start({mode:"master", sda:2, scl:3, clock:400000});
     * obniz.i2c0.end();
     * ```
     */
    end() {
        const obj = {};
        obj["i2c" + this.id] = null;
        this.Obniz.send(obj);
        this.used = false;
    }
    addObserver(callback) {
        if (callback) {
            this.observers.push(callback);
        }
    }
}
exports.default = PeripheralI2C;

//# sourceMappingURL=i2c.js.map