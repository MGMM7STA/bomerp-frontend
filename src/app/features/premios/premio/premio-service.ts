import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { Premio, PremioRequest } from './premio.model';

@Injectable({ providedIn: 'root' })
export class PremioService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/premios';

  listar(categoriaId?: number): Observable<Premio[]> {
    let params = new HttpParams();
    if (categoriaId !== undefined && categoriaId !== null) {
      params = params.set('categoriaId', categoriaId);
    }
    return this.http.get<Premio[]>(this.api.buildUrl(this.resource), { params });
  }

  obtener(id: number): Observable<Premio> {
    return this.http.get<Premio>(this.api.buildUrl(`${this.resource}/${id}`));
  }

  crear(request: PremioRequest): Observable<Premio> {
    return this.http.post<Premio>(this.api.buildUrl(this.resource), request);
  }

  actualizar(id: number, request: PremioRequest): Observable<Premio> {
    return this.http.put<Premio>(this.api.buildUrl(`${this.resource}/${id}`), request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(this.api.buildUrl(`${this.resource}/${id}`));
  }
}
