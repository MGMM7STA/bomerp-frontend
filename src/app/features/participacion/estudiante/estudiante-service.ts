import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { Estudiante, Ranking } from './estudiante.model';

@Injectable({ providedIn: 'root' })
export class EstudianteService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly resource = '/api/v1/participacion/estudiantes';

  yo(): Observable<Estudiante> {
    return this.http.get<Estudiante>(this.api.buildUrl(`${this.resource}/yo`));
  }

  listar(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(this.api.buildUrl(this.resource));
  }

  ranking(limite = 50, campaniaId?: number): Observable<Ranking> {
    const params: Record<string, number> = { limite };
    if (campaniaId) params['campaniaId'] = campaniaId;
    return this.http.get<Ranking>(this.api.buildUrl(`${this.resource}/ranking`), { params });
  }
}
