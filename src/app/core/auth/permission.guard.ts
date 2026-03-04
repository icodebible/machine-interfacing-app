import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Authority } from './authorities';
import { AuthService } from './auth.service';

export const permissionGuard = (a: Authority): CanActivateFn => () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.has(a)) {
        router.navigateByUrl('/app/dashboard');
        return false;
    }
    return true;
};