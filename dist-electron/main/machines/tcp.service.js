"use strict";
// import net from 'net';
// import { MachineMessage, TcpConfig } from './types';
// import { logger } from '../../logging/logger';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpMachineService = void 0;
// export class TcpMachineService {
//     private socket?: net.Socket;
//     connect(cfg: TcpConfig, onMessage: (m: MachineMessage) => void) {
//         this.disconnect();
//         this.socket = new net.Socket();
//         this.socket.on('connect', () => logger.info(`TCP connected ${cfg.host}:${cfg.port}`));
//         this.socket.on('error', (e) => logger.error('TCP error', e));
//         this.socket.on('close', () => logger.info('TCP closed'));
//         this.socket.on('data', (buf) => {
//             onMessage({
//                 timestamp: new Date().toISOString(),
//                 direction: 'in',
//                 payload: buf.toString('utf8'),
//             });
//         });
//         this.socket.connect(cfg.port, cfg.host);
//     }
//     send(payload: string) {
//         if (!this.socket) throw new Error('TCP not connected');
//         this.socket.write(payload);
//     }
//     disconnect() {
//         try {
//             this.socket?.destroy();
//         } finally {
//             this.socket = undefined;
//         }
//     }
// }
const net_1 = __importDefault(require("net"));
const logger_1 = require("../../logging/logger");
class TcpMachineService {
    socket;
    server;
    clients = new Set();
    connect(cfg, onMessage, onStatus) {
        this.disconnect();
        const host = cfg.host || '127.0.0.1';
        const port = Number(cfg.port);
        this.socket = new net_1.default.Socket();
        this.socket.on('connect', () => {
            const message = `TCP client connected to ${host}:${port}`;
            logger_1.logger.info(message);
            onStatus?.({ status: 'connected', message });
        });
        this.socket.on('error', (e) => {
            logger_1.logger.error('TCP client error', e);
            onStatus?.({ status: 'error', message: e?.message ?? 'TCP client error' });
        });
        this.socket.on('close', () => {
            logger_1.logger.info('TCP client closed');
            onStatus?.({ status: 'disconnected', message: 'TCP client disconnected' });
        });
        this.socket.on('data', (buf) => {
            onMessage({
                timestamp: new Date().toISOString(),
                direction: 'in',
                payload: buf.toString('utf8'),
                remoteAddress: this.socket?.remoteAddress ?? null,
                remotePort: this.socket?.remotePort ?? null,
            });
        });
        this.socket.connect(port, host);
    }
    listen(cfg, onMessage, onStatus) {
        this.disconnect();
        const host = cfg.host || '0.0.0.0';
        const port = Number(cfg.port);
        this.server = net_1.default.createServer((client) => {
            this.clients.add(client);
            const remote = `${client.remoteAddress ?? 'unknown'}:${client.remotePort ?? 'unknown'}`;
            const message = `TCP analyzer connected from ${remote}`;
            logger_1.logger.info(message);
            onStatus?.({ status: 'connected', message });
            client.on('data', (buf) => {
                onMessage({
                    timestamp: new Date().toISOString(),
                    direction: 'in',
                    payload: buf.toString('utf8'),
                    remoteAddress: client.remoteAddress ?? null,
                    remotePort: client.remotePort ?? null,
                });
            });
            client.on('error', (e) => {
                logger_1.logger.error(`TCP analyzer socket error from ${remote}`, e);
                onStatus?.({ status: 'error', message: e?.message ?? 'TCP analyzer socket error' });
            });
            client.on('close', () => {
                this.clients.delete(client);
                const closeMessage = `TCP analyzer disconnected from ${remote}`;
                logger_1.logger.info(closeMessage);
                onStatus?.({ status: 'listening', message: closeMessage });
            });
        });
        this.server.on('error', (e) => {
            logger_1.logger.error('TCP server error', e);
            onStatus?.({ status: 'error', message: e?.message ?? 'TCP server error' });
        });
        this.server.listen(port, host, () => {
            const address = this.server?.address();
            const bound = typeof address === 'object' && address
                ? `${address.address}:${address.port}`
                : `${host}:${port}`;
            const message = `TCP server listening on ${bound}`;
            logger_1.logger.info(message);
            onStatus?.({ status: 'listening', message });
        });
    }
    start(cfg, onMessage, onStatus) {
        const mode = cfg.mode ?? 'SERVER';
        if (mode === 'CLIENT') {
            this.connect(cfg, onMessage, onStatus);
            return;
        }
        this.listen(cfg, onMessage, onStatus);
    }
    send(payload) {
        if (this.socket && !this.socket.destroyed) {
            this.socket.write(payload);
            return;
        }
        const activeClients = Array.from(this.clients).filter((client) => !client.destroyed);
        if (activeClients.length === 0) {
            throw new Error('TCP not connected to any peer');
        }
        for (const client of activeClients) {
            client.write(payload);
        }
    }
    disconnect() {
        for (const client of this.clients) {
            try {
                client.destroy();
            }
            catch {
                // ignore shutdown errors
            }
        }
        this.clients.clear();
        try {
            this.socket?.destroy();
        }
        finally {
            this.socket = undefined;
        }
        try {
            this.server?.close();
        }
        catch {
            // ignore shutdown errors
        }
        finally {
            this.server = undefined;
        }
    }
}
exports.TcpMachineService = TcpMachineService;
