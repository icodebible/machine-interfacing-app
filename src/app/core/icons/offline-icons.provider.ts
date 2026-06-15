import { ENVIRONMENT_INITIALIZER, Provider, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { OFFLINE_MATERIAL_ICONS } from './offline-icons.generated';

/**
 * Registers all application Material-style icons as local inline SVG icons.
 *
 * This is the primary production icon strategy for Electron packaging:
 * - no Google Fonts CDN
 * - no icon font ligature dependency
 * - no file:// runtime font loading issue
 * - no AppImage/.deb path issue
 * - works offline on Linux, Windows, and macOS
 */
export function provideOfflineMaterialIcons(): Provider {
  return {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useValue: () => {
      const iconRegistry = inject(MatIconRegistry);
      const sanitizer = inject(DomSanitizer);

      for (const icon of OFFLINE_MATERIAL_ICONS) {
        iconRegistry.addSvgIconLiteral(
          icon.name,
          sanitizer.bypassSecurityTrustHtml(icon.svg)
        );
      }

      // Keep font-ligature mode as a fallback for any legacy mat-icon
      // usage that has not yet been migrated to svgIcon.
      iconRegistry.setDefaultFontSetClass('material-icons', 'mat-ligature-font');
      iconRegistry.registerFontClassAlias(
        'material-icons',
        'material-icons mat-ligature-font'
      );
    },
  };
}
