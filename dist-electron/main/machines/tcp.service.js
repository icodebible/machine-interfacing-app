"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpMachineService = void 0;
const net_1 = __importDefault(require("net"));
const logger_1 = require("../../logging/logger");
class TcpMachineService {
    socket;
    connect(cfg, onMessage) {
        this.disconnect();
        this.socket = new net_1.default.Socket();
        this.socket.on('connect', () => logger_1.logger.info(`TCP connected ${cfg.host}:${cfg.port}`));
        this.socket.on('error', (e) => logger_1.logger.error('TCP error', e));
        this.socket.on('close', () => logger_1.logger.info('TCP closed'));
        this.socket.on('data', (buf) => {
            onMessage({
                timestamp: new Date().toISOString(),
                direction: 'in',
                payload: buf.toString('utf8'),
            });
        });
        this.socket.connect(cfg.port, cfg.host);
    }
    send(payload) {
        if (!this.socket)
            throw new Error('TCP not connected');
        this.socket.write(payload);
    }
    disconnect() {
        try {
            this.socket?.destroy();
        }
        finally {
            this.socket = undefined;
        }
    }
}
exports.TcpMachineService = TcpMachineService;
