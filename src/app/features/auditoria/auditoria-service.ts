import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api-service';
import { PaginaEventos } from './auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/auditoria';

  buscar(accion: string, usuario: string, pagina: number, tamanio: number): Observable<PaginaEventos> {
    let params = new HttpParams().set('pagina', pagina).set('tamanio', tamanio);
    if (accion) params = params.set('accion', accion);
    if (usuario.trim()) params = params.set('usuario', usuario.trim());
    return this.http.get<PaginaEventos>(this.api.buildUrl(this.resource), { params });
  }

  acciones(): Observable<string[]> {
    return this.http.get<string[]>(this.api.buildUrl(`${this.resource}/acciones`));
  }
}
