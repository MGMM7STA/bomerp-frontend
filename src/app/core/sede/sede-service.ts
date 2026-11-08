import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from '../services/api-service';
import { AuthService } from '../auth/auth-service';

export type Sede = 'LIMA' | 'JULIACA' | 'TARAPOTO';

export const SEDES: { valor: Sede; nombre: string }[] = [
  { valor: 'LIMA', nombre: 'Lima' },
  { valor: 'JULIACA', nombre: 'Juliaca' },
  { valor: 'TARAPOTO', nombre: 'Tarapoto' },
];

const CLAVE = 'bomerp_sede_admin';

export function nombreSede(sede: string | null | undefined): string {
  return SEDES.find((s) => s.valor === sede)?.nombre ?? 'Sin sede';
}

@Injectable({ providedIn: 'root' })
export class SedeService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly propia = signal<Sede | null>(null);
  private readonly elegida = signal<Sede>(this.leer());
  readonly version = signal(0);
  readonly cargada = signal(false);

  readonly esAdmin = computed(() => this.auth.tieneRol('ADMIN'));
  readonly actual = computed<Sede | null>(() => (this.esAdmin() ? this.elegida() : this.propia()));
  readonly nombre = computed(() => nombreSede(this.actual()));

  cargar(): void {
    this.http.get<{ usuario: string; sede: Sede | null }>(this.api.buildUrl('/api/v1/sedes/yo')).subscribe({
      next: (respuesta) => {
        this.propia.set(respuesta.sede);
        this.cargada.set(true);
      },
      error: () => this.cargada.set(true),
    });
  }

  elegir(sede: Sede): void {
    if (sede === this.elegida()) return;
    this.elegida.set(sede);
    try {
      sessionStorage.setItem(CLAVE, sede);
    } catch {}
    this.version.update((v) => v + 1);
  }

  parametro(): Sede | null {
    return this.esAdmin() ? this.elegida() : null;
  }

  private leer(): Sede {
    try {
      const guardada = sessionStorage.getItem(CLAVE);
      if (SEDES.some((s) => s.valor === guardada)) return guardada as Sede;
    } catch {}
    return 'JULIACA';
  }
}
