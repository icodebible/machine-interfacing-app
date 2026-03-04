import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ElectronBridgeService } from '../../core/electron/electron-bridge.service';
import { RouterModule } from '@angular/router';

type SerialPortInfo = {
  path?: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
};

@Component({
  selector: 'app-machine-console',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './machine-console.html',
  styleUrl: './machine-console.scss',
})
export class MachineConsole {
  private destroyRef = inject(DestroyRef);
  bridge = inject(ElectronBridgeService);

  // TCP form
  tcpHost = signal('127.0.0.1');
  tcpPort = signal(5000);
  tcpPayload = signal('');

  // Serial form
  serialPorts = signal<SerialPortInfo[]>([]);
  serialPath = signal('');
  serialBaudRate = signal(9600);
  serialPayload = signal('');

  // UI feedback
  status = signal<string>('Ready');
  error = signal<string>('');

  constructor() {
    // Subscribe to machine messages when in Electron
    effect(() => {
      if (this.bridge.isElectron()) {
        this.bridge.initMachineListener();
      }
    });

    // Clean up if needed
    this.destroyRef.onDestroy(() => {
      this.bridge.disposeMachineListener();
    });
  }

  async refreshSerialPorts() {
    this.error.set('');
    try {
      this.status.set('Loading serial ports...');
      const ports = await this.bridge.serialList();
      this.serialPorts.set(ports as SerialPortInfo[]);
      if (!this.serialPath() && ports?.length) {
        this.serialPath.set((ports[0] as any)?.path ?? '');
      }
      this.status.set(`Found ${ports?.length ?? 0} port(s)`);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load serial ports');
      this.status.set('Error');
    }
  }

  async tcpConnect() {
    this.error.set('');
    try {
      this.status.set('Connecting TCP...');
      await this.bridge.tcpConnect(this.tcpHost(), Number(this.tcpPort()));
      this.status.set('TCP connected');
    } catch (e: any) {
      this.error.set(e?.message ?? 'TCP connect failed');
      this.status.set('Error');
    }
  }

  async tcpSend() {
    this.error.set('');
    try {
      const payload = this.tcpPayload().trim();
      if (!payload) return;

      await this.bridge.tcpSend(payload);
      this.status.set('TCP sent');
      this.tcpPayload.set('');
    } catch (e: any) {
      this.error.set(e?.message ?? 'TCP send failed');
      this.status.set('Error');
    }
  }

  async tcpDisconnect() {
    this.error.set('');
    try {
      await this.bridge.tcpDisconnect();
      this.status.set('TCP disconnected');
    } catch (e: any) {
      this.error.set(e?.message ?? 'TCP disconnect failed');
      this.status.set('Error');
    }
  }

  async serialConnect() {
    this.error.set('');
    try {
      const path = this.serialPath();
      const baudRate = Number(this.serialBaudRate());
      if (!path) throw new Error('Select a serial port');
      if (!baudRate || baudRate < 300) throw new Error('Invalid baud rate');

      this.status.set('Connecting Serial...');
      await this.bridge.serialConnect(path, baudRate);
      this.status.set('Serial connected');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Serial connect failed');
      this.status.set('Error');
    }
  }

  async serialSend() {
    this.error.set('');
    try {
      const payload = this.serialPayload().trim();
      if (!payload) return;

      await this.bridge.serialSend(payload);
      this.status.set('Serial sent');
      this.serialPayload.set('');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Serial send failed');
      this.status.set('Error');
    }
  }

  async serialDisconnect() {
    this.error.set('');
    try {
      await this.bridge.serialDisconnect();
      this.status.set('Serial disconnected');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Serial disconnect failed');
      this.status.set('Error');
    }
  }

  clearLog() {
    this.bridge.clearMessages();
    this.status.set('Log cleared');
  }
}
