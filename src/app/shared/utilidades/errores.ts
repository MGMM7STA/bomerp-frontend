import { HttpErrorResponse } from '@angular/common/http';

export function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa que el backend esté encendido.';
    }
    const mensaje = error.error?.message;
    if (typeof mensaje === 'string' && mensaje.trim()) {
      return mensaje;
    }
  }
  return porDefecto;
}
