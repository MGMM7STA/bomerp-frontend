import { Component, OnDestroy, effect, inject, input, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RegistroService } from '../../features/participacion/registro/registro-service';

@Component({
  selector: 'app-foto-ampliada',
  imports: [MatDialogModule],
  template: `
    <figure class="ampliada">
      <img [src]="url" alt="Foto de la evidencia" />
      <button type="button" class="cerrar" mat-dialog-close aria-label="Cerrar">
        <span class="material-symbols-outlined">close</span>
      </button>
    </figure>
  `,
  styles: `
    .ampliada {
      position: relative;
      margin: 0;
      background: #0d1b2a;
    }
    img {
      display: block;
      max-width: min(92vw, 900px);
      max-height: 82vh;
      margin: 0 auto;
    }
    .cerrar {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      display: grid;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.92);
      color: var(--ss-navy);
      cursor: pointer;
    }
  `,
})
export class FotoAmpliada {
  protected readonly url = inject<string>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-foto-evidencia',
  template: `
    @if (url(); as src) {
      <button type="button" class="miniatura" (click)="ampliar(src)" aria-label="Ver foto">
        <img [src]="src" alt="Foto de la evidencia" />
        <span class="lupa"><span class="material-symbols-outlined">zoom_in</span></span>
      </button>
    } @else if (fallo()) {
      <span class="miniatura vacia" title="No se pudo cargar la foto">
        <span class="material-symbols-outlined">broken_image</span>
      </span>
    } @else {
      <span class="miniatura vacia cargando">
        <span class="material-symbols-outlined">image</span>
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-block;
      flex-shrink: 0;
    }
    .miniatura {
      position: relative;
      display: grid;
      place-items: center;
      width: var(--tamanio, 64px);
      height: var(--tamanio, 64px);
      padding: 0;
      border: 1px solid var(--ss-line);
      border-radius: 10px;
      overflow: hidden;
      background: #eef1f4;
      color: #9aa6b3;
      cursor: zoom-in;
    }
    .miniatura img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .lupa {
      position: absolute;
      right: 4px;
      bottom: 4px;
      display: grid;
      place-items: center;
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 6px;
      background: rgba(0, 42, 77, 0.75);
      color: #fff;
    }
    .lupa .material-symbols-outlined {
      font-size: 0.95rem;
    }
    .vacia {
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
export class FotoEvidencia implements OnDestroy {
  private readonly registroService = inject(RegistroService);
  private readonly dialogo = inject(MatDialog);

  readonly registroId = input.required<number>();
  readonly detalleId = input.required<number>();

  protected readonly url = signal<string | null>(null);
  protected readonly fallo = signal(false);

  constructor() {
    effect((limpiar) => {
      const suscripcion = this.registroService.foto(this.registroId(), this.detalleId()).subscribe({
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
