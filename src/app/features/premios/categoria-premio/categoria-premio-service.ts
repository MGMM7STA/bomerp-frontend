import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { CategoriaPremio, CategoriaPremioRequest } from './categoria-premio.model';

@Injectable({ providedIn: 'root' })
export class CategoriaPremioService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/categorias-premio';

  listar(): Observable<CategoriaPremio[]> {
    return this.http.get<CategoriaPremio[]>(this.api.buildUrl(this.resource));
  }

  obtener(id: number): Observable<CategoriaPremio> {
    return this.http.get<CategoriaPremio>(this.api.buildUrl(`${this.resource}/${id}`));
  }

  crear(request: CategoriaPremioRequest): Observable<CategoriaPremio> {
    return this.http.post<CategoriaPremio>(this.api.buildUrl(this.resource), request);
  }

  actualizar(id: number, request: CategoriaPremioRequest): Observable<CategoriaPremio> {
    return this.http.put<CategoriaPremio>(this.api.buildUrl(`${this.resource}/${id}`), request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(this.api.buildUrl(`${this.resource}/${id}`));
  }
}
