import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api-service';
import { Aprobacion, EstadoSolicitud, SolicitudCuenta } from './solicitud.model';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/solicitudes-cuenta';

  listar(estado?: EstadoSolicitud): Observable<SolicitudCuenta[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<SolicitudCuenta[]>(this.api.buildUrl(this.resource), { params });
  }

  carne(id: number): Observable<Blob> {
    return this.http.get(this.api.buildUrl(`${this.resource}/${id}/carne`), { responseType: 'blob' });
  }

  aprobar(id: number, usuario: string, enviarCorreo: boolean): Observable<Aprobacion> {
    return this.http.patch<Aprobacion>(this.api.buildUrl(`${this.resource}/${id}/aprobar`), {
      usuario,
      enviarCorreo,
    });
  }

  rechazar(id: number, motivo: string): Observable<SolicitudCuenta> {
    return this.http.patch<SolicitudCuenta>(this.api.buildUrl(`${this.resource}/${id}/rechazar`), { motivo });
  }

  exportarOdoo(tipo: 'contactos' | 'puntos'): Observable<Blob> {
    return this.http.get(this.api.buildUrl(`/api/v1/participacion/estudiantes/exportar-odoo/${tipo}`), {
      responseType: 'blob',
    });
  }
}
