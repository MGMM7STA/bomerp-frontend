import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const conToken = (token: string | null) =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(conToken(auth.accessToken())).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return from(auth.refrescar()).pipe(
          switchMap((renovado) => {
            if (!renovado) {
              auth.iniciarLogin();
              return throwError(() => error);
            }
            return next(conToken(auth.accessToken()));
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};