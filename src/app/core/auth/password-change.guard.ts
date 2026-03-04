// import { CanActivateFn, Router } from '@angular/router';
// import { inject } from '@angular/core';
// import { AuthService } from './auth.service';

// export const passwordChangeGuard: CanActivateFn = () => {
//     const auth = inject(AuthService);
//     const router = inject(Router);

//     const u = auth.user();
//     if (u?.mustChangePassword) {
//         router.navigateByUrl('/app/settings?mode=change-password');
//         return false;
//     }
//     return true;
// };

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const passwordChangeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const u = auth.user();
  if (u?.mustChangePassword) {
    router.navigateByUrl('/app/settings?mode=change-password');
    return false;
  }
  return true;
};