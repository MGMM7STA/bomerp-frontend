import { Component, OnDestroy, effect, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api-service';
import { FotoAmpliada } from '../foto-evidencia/foto-evidencia';

@Component({
  selector: 'app-imagen-segura',
  template: `
    @if (url(); as src) {
      <button type="button" class="marco" (click)="ampliar(src)" [attr.aria-label]="texto()">
        <img [src]="src" [alt]="texto()" />
        <span class="lupa"><span class="material-symbols-outlined">zoom_in</span></span>
      </button>
    } @else {
      <span class="marco vacio" [class.cargando]="!fallo()">
        <span class="material-symbols-outlined">{{ fallo() ? 'broken_image' : 'image' }}</span>
      </span>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .marco {
      position: relative;
      display: grid;
      place-items: center;
      width: var(--ancho, 100%);
      height: var(--alto, 120px);
      padding: 0;
      border: 1px solid var(--ss-line);
      border-radius: 10px;
      overflow: hidden;
      background: #eef1f4;
      color: #9aa6b3;
      cursor: zoom-in;
    }
    .marco img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .lupa {
      position: absolute;
      right: 6px;
      bottom: 6px;
      display: grid;
      place-items: center;
      width: 1.6rem;
      height: 1.6rem;
      border-radius: 7px;
      background: rgba(0, 42, 77, 0.75);
      color: #fff;
    }
    .lupa .material-symbols-outlined {
      font-size: 1rem;
    }
    .vacio {
      cursor: default;
    }
    .cargando {
      animation: pulso 1.2s ease-in-out infinite;
    }
    @keyframes pulso {
      50% {
        opacity: 0.5;
      }
    }
  `,
})
export class ImagenSegura implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly dialogo = inject(MatDialog);

  readonly ruta = input.required<string>();
  readonly texto = input('Imagen');

  protected readonly url = signal<string | null>(null);
  protected readonly fallo = signal(false);

  constructor() {
    effect((limpiar) => {
      const suscripcion = this.http.get(this.api.buildUrl(this.ruta()), { responseType: 'blob' }).subscribe({
        next: (blob) => {
          this.liberar();
          this.url.set(URL.createObjectURL(blob));
        },
        error: () => this.fallo.set(true),
      });
      limpiar(() => suscripcion.unsubscribe());
    });
  }

  protected ampliar(src: string): void {
    this.dialogo.open(FotoAmpliada, { data: src, panelClass: 'ss-dialogo-foto', autoFocus: false });
  }

  ngOnDestroy(): void {
    this.liberar();
  }

  private liberar(): void {
    const actual = this.url();
    if (actual) URL.revokeObjectURL(actual);
  }
}
