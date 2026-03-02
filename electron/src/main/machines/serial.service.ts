import { SerialPort } from 'serialport';
import { MachineMessage, SerialConfig } from './types';
import { logger } from '../../logging/logger';

export class SerialMachineService {
    private port?: SerialPort;

    connect(cfg: SerialConfig, onMessage: (m: MachineMessage) => void) {
        this.disconnect();

        this.port = new SerialPort({
            path: cfg.path,
            baudRate: cfg.baudRate,
            autoOpen: true,
        });

        this.port.on('open', () => logger.info(`Serial opened ${cfg.path}@${cfg.baudRate}`));
        this.port.on('error', (e) => logger.error('Serial error', e));
        this.port.on('close', () => logger.info('Serial closed'));

        this.port.on('data', (buf) => {
            onMessage({
                timestamp: new Date().toISOString(),
                direction: 'in',
                payload: buf.toString('utf8'),
            });
        });
    }

    async listPorts() {
        return SerialPort.list();
    }

    send(payload: string) {
        if (!this.port) throw new Error('Serial not connected');
        this.port.write(payload);
    }

    disconnect() {
        try {
            this.port?.close();
        } catch {
            // ignore
        } finally {
            this.port = undefined;
        }
    }
}