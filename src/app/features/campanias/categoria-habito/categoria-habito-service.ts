import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { CategoriaHabito } from './categoria-habito.model';

@Injectable({ providedIn: 'root' })
export class CategoriaHabitoService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/categorias-habito';

  listar(): Observable<CategoriaHabito[]> {
    return this.http.get<CategoriaHabito[]>(this.api.buildUrl(this.resource));
  }

  obtener(id: number): Observable<CategoriaHabito> {
    return this.http.get<CategoriaHabito>(this.api.buildUrl(`${this.resource}/${id}`));
  }

  crear(categoria: CategoriaHabito): Observable<CategoriaHabito> {
    return this.http.post<CategoriaHabito>(this.api.buildUrl(this.resource), categoria);
  }

  actualizar(id: number, categoria: CategoriaHabito): Observable<CategoriaHabito> {
    return this.http.put<CategoriaHabito>(this.api.buildUrl(`${this.resource}/${id}`), categoria);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(this.api.buildUrl(`${this.resource}/${id}`));
  }
}
