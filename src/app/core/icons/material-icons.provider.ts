import { ENVIRONMENT_INITIALIZER, Provider, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';

/**
 * Sets Angular Material's default <mat-icon> mode to local Material Icons
 * ligature font rendering.
 */
export function provideMaterialIconRuntime(): Provider {
  return {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useValue: () => {
      const iconRegistry = inject(MatIconRegistry);

      iconRegistry.setDefaultFontSetClass(
        'material-icons',
        'mat-ligature-font'
      );

      iconRegistry.registerFontClassAlias(
        'material-icons',
        'material-icons mat-ligature-font'
      );
    },
  };
}
