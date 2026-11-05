import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { Habito } from '../habito/habito.model';
import { Campania, CampaniaRequest } from './campania.model';

@Injectable({ providedIn: 'root' })
export class CampaniaService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/campanias';

  listar(): Observable<Campania[]> {
    return this.http.get<Campania[]>(this.api.buildUrl(this.resource));
  }

  obtener(id: number): Observable<Campania> {
    return this.http.get<Campania>(this.api.buildUrl(`${this.resource}/${id}`));
  }

  obtenerActiva(): Observable<Campania> {
    return this.http.get<Campania>(this.api.buildUrl(`${this.resource}/activa`));
  }

  habitosDeActiva(): Observable<Habito[]> {
    return this.http.get<Habito[]>(this.api.buildUrl(`${this.resource}/activa/habitos`));
  }

  crear(campania: CampaniaRequest): Observable<Campania> {
    return this.http.post<Campania>(this.api.buildUrl(this.resource), campania);
  }

  actualizar(id: number, campania: CampaniaRequest): Observable<Campania> {
    return this.http.put<Campania>(this.api.buildUrl(`${this.resource}/${id}`), campania);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(this.api.buildUrl(`${this.resource}/${id}`));
  }
}
