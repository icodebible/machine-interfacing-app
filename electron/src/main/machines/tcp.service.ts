import net from 'net';
import { MachineMessage, TcpConfig } from './types';
import { logger } from '../../logging/logger';

export class TcpMachineService {
    private socket?: net.Socket;

    connect(cfg: TcpConfig, onMessage: (m: MachineMessage) => void) {
        this.disconnect();

        this.socket = new net.Socket();

        this.socket.on('connect', () => logger.info(`TCP connected ${cfg.host}:${cfg.port}`));
        this.socket.on('error', (e) => logger.error('TCP error', e));
        this.socket.on('close', () => logger.info('TCP closed'));

        this.socket.on('data', (buf) => {
            onMessage({
                timestamp: new Date().toISOString(),
                direction: 'in',
                payload: buf.toString('utf8'),
            });
        });

        this.socket.connect(cfg.port, cfg.host);
    }

    send(payload: string) {
        if (!this.socket) throw new Error('TCP not connected');
        this.socket.write(payload);
    }

    disconnect() {
        try {
            this.socket?.destroy();
        } finally {
            this.socket = undefined;
        }
    }
}