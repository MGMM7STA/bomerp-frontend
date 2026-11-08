import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SedeService } from '../sede/sede-service';

export const sedeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(`${environment.apiBaseUrl}/api/`) || req.params.has('sede') || req.url.includes('sede=')) {
    return next(req);
  }
  const sede = inject(SedeService).parametro();
  return next(sede ? req.clone({ params: req.params.set('sede', sede) }) : req);
};
