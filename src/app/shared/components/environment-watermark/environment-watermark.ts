import { Component } from '@angular/core';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-environment-watermark',
  imports: [],
  templateUrl: './environment-watermark.html',
  styleUrl: './environment-watermark.scss',
})
export class EnvironmentWatermark {
  readonly deploymentBanner = environment.deploymentBanner;
  readonly enabled = environment.deploymentBanner.enabled;
  readonly tiles = Array.from({ length: 48 });
  readonly watermarkText =
    environment.deploymentBanner.watermark ||
    `${environment.deploymentBanner.shortLabel} · TESTING ONLY · NOT FOR PRODUCTION DATA`;
}
