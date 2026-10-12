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

  crear(registro: RegistroRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(this.api.buildUrl(this.resource), registro);
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
}
