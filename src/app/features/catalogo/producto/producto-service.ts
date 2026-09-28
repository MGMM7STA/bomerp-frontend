import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { Producto, ProductoRequest } from './producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/productos';

  listar(categoriaId?: number): Observable<Producto[]> {
    let params = new HttpParams();
    if (categoriaId) {
      params = params.set('categoriaId', categoriaId);
    }
    return this.http.get<Producto[]>(this.api.buildUrl(this.resource), { params });
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(this.api.buildUrl(`${this.resource}/${id}`));
  }

  crear(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.api.buildUrl(this.resource), producto);
  }

  actualizar(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(this.api.buildUrl(`${this.resource}/${id}`), producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(this.api.buildUrl(`${this.resource}/${id}`));
  }
}