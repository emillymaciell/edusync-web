import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRole: UserRole): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();

    if (role === allowedRole) {
      return true;
    }
    if (role) {
      return router.createUrlTree([`/${role}`]);
    }
    return router.createUrlTree(['/login']);
  };
};
