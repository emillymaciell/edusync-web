import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/subjects/active',
];

function isPublicApiRequest(url: string): boolean {
  return PUBLIC_API_PATHS.some((path) => url.includes(path));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicApiRequest(req.url)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  const authorizedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authorizedReq);
};
