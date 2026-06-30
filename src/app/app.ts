import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EnvironmentWatermark } from './shared/components/environment-watermark/environment-watermark';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EnvironmentWatermark],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('machine-interfacing-app-1');

  version = signal<string>('loading...');
  pong = signal<string>('');

  async ngOnInit() {
    console.log('appAPI exists?', (window as any)?.ng);
    // Works in Electron, but in web-only ng serve you might not have window.appAPI
    if (window?.appAPI) {
      this.version.set(await window.appAPI.getAppVersion());
      this.pong.set(await window.appAPI.ping('hello'));
    } else {
      this.version.set('web mode');
    }
  }
}
