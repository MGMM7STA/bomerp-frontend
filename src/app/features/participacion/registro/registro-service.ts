import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { RegistroRequest, RegistroResponse } from './registro.model';

@Injectable({ providedIn: 'root' })
export class RegistroService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/participacion/registros';

  crear(registro: RegistroRequest, fotos: (Blob | null)[] = []): Observable<RegistroResponse> {
    const datos = new FormData();
    datos.append('registro', new Blob([JSON.stringify(registro)], { type: 'application/json' }));
    fotos.forEach((foto, indice) => {
      if (foto) datos.append(`foto-${indice}`, foto, `foto-${indice}.jpg`);
    });
    return this.http.post<RegistroResponse>(this.api.buildUrl(this.resource), datos);
  }

  buscar(
    estado?: string,
    estudianteId?: number,
    desde?: string,
    hasta?: string,
    ordenarPor = 'fecha',
    direccion = 'DESC',
  ): Observable<RegistroResponse[]> {
    let params = new HttpParams().set('ordenarPor', ordenarPor).set('direccion', direccion);
    if (estado) params = params.set('estado', estado);
    if (estudianteId) params = params.set('estudianteId', estudianteId);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<RegistroResponse[]>(this.api.buildUrl(this.resource), { params });
  }

  anular(id: number): Observable<RegistroResponse> {
    return this.http.patch<RegistroResponse>(this.api.buildUrl(`${this.resource}/${id}/anular`), {});
  }

  validar(id: number): Observable<RegistroResponse> {
    return this.http.patch<RegistroResponse>(this.api.buildUrl(`${this.resource}/${id}/validar`), {});
  }

  rechazar(id: number, motivo: string): Observable<RegistroResponse> {
    return this.http.patch<RegistroResponse>(this.api.buildUrl(`${this.resource}/${id}/rechazar`), {
      motivo,
    });
  }

  validarDetalle(id: number, detalleId: number): Observable<RegistroResponse> {
    return this.http.patch<RegistroResponse>(
      this.api.buildUrl(`${this.resource}/${id}/detalles/${detalleId}/validar`),
      {},
    );
  }

  rechazarDetalle(id: number, detalleId: number, motivo: string): Observable<RegistroResponse> {
    return this.http.patch<RegistroResponse>(
      this.api.buildUrl(`${this.resource}/${id}/detalles/${detalleId}/rechazar`),
      { motivo },
    );
  }

  foto(id: number, detalleId: number): Observable<Blob> {
    return this.http.get(this.api.buildUrl(`${this.resource}/${id}/detalles/${detalleId}/foto`), {
      responseType: 'blob',
    });
  }
}
