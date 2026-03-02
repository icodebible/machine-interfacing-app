"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialMachineService = void 0;
const serialport_1 = require("serialport");
const logger_1 = require("../../logging/logger");
class SerialMachineService {
    port;
    connect(cfg, onMessage) {
        this.disconnect();
        this.port = new serialport_1.SerialPort({
            path: cfg.path,
            baudRate: cfg.baudRate,
            autoOpen: true,
        });
        this.port.on('open', () => logger_1.logger.info(`Serial opened ${cfg.path}@${cfg.baudRate}`));
        this.port.on('error', (e) => logger_1.logger.error('Serial error', e));
        this.port.on('close', () => logger_1.logger.info('Serial closed'));
        this.port.on('data', (buf) => {
            onMessage({
                timestamp: new Date().toISOString(),
                direction: 'in',
                payload: buf.toString('utf8'),
            });
        });
    }
    async listPorts() {
        return serialport_1.SerialPort.list();
    }
    send(payload) {
        if (!this.port)
            throw new Error('Serial not connected');
        this.port.write(payload);
    }
    disconnect() {
        try {
            this.port?.close();
        }
        catch {
            // ignore
        }
        finally {
            this.port = undefined;
        }
    }
}
exports.SerialMachineService = SerialMachineService;
