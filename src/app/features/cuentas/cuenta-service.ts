import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api-service';
import { Cuenta, CuentaRequest, RolCuenta } from './cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/cuentas';

  listar(): Observable<Cuenta[]> {
    return this.http.get<Cuenta[]>(this.api.buildUrl(this.resource));
  }

  crear(cuenta: CuentaRequest): Observable<Cuenta> {
    return this.http.post<Cuenta>(this.api.buildUrl(this.resource), cuenta);
  }

  cambiarRol(id: string, rol: RolCuenta): Observable<Cuenta> {
    return this.http.patch<Cuenta>(this.api.buildUrl(`${this.resource}/${id}/rol`), { rol });
  }

  cambiarEstado(id: string, activa: boolean): Observable<Cuenta> {
    return this.http.patch<Cuenta>(this.api.buildUrl(`${this.resource}/${id}/estado`), { activa });
  }

  restablecerContrasenia(id: string, contrasenia: string): Observable<void> {
    return this.http.patch<void>(this.api.buildUrl(`${this.resource}/${id}/contrasenia`), {
      contrasenia,
    });
  }
}
