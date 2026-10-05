import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { Habito, HabitoRequest } from './habito.model';

@Injectable({ providedIn: 'root' })
export class HabitoService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/habitos';

  listar(categoriaId?: number): Observable<Habito[]> {
    let params = new HttpParams();
    if (categoriaId) {
      params = params.set('categoriaId', categoriaId);
    }
    return this.http.get<Habito[]>(this.api.buildUrl(this.resource), { params });
  }

  obtener(id: number): Observable<Habito> {
    return this.http.get<Habito>(this.api.buildUrl(`${this.resource}/${id}`));
  }

  crear(habito: HabitoRequest): Observable<Habito> {
    return this.http.post<Habito>(this.api.buildUrl(this.resource), habito);
  }

  actualizar(id: number, habito: HabitoRequest): Observable<Habito> {
    return this.http.put<Habito>(this.api.buildUrl(`${this.resource}/${id}`), habito);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(this.api.buildUrl(`${this.resource}/${id}`));
  }
}
