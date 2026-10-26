import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { ActaPremiacion, ActaPremiacionRequest } from './acta-premiacion.model';

@Injectable({ providedIn: 'root' })
export class ActaPremiacionService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/actas-premiacion';

  listar(): Observable<ActaPremiacion[]> {
    return this.http.get<ActaPremiacion[]>(this.api.buildUrl(this.resource));
  }

  obtener(id: number): Observable<ActaPremiacion> {
    return this.http.get<ActaPremiacion>(this.api.buildUrl(`${this.resource}/${id}`));
  }

  emitir(request: ActaPremiacionRequest): Observable<ActaPremiacion> {
    return this.http.post<ActaPremiacion>(this.api.buildUrl(this.resource), request);
  }

  anular(id: number): Observable<ActaPremiacion> {
    return this.http.patch<ActaPremiacion>(this.api.buildUrl(`${this.resource}/${id}/anular`), {});
  }
}
