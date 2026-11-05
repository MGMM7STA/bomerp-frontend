import { Component, Injectable, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  aceptar?: string;
  icono?: string;
  peligro?: boolean;
}

@Component({
  selector: 'app-confirmacion',
  imports: [MatDialogModule],
  template: `
    <div class="caja">
      <span class="icono" [class.peligro]="datos.peligro">
        <span class="material-symbols-outlined">{{ datos.icono ?? (datos.peligro ? 'delete' : 'help') }}</span>
      </span>
      <h2>{{ datos.titulo }}</h2>
      <p>{{ datos.mensaje }}</p>
      <div class="pie">
        <button type="button" class="ss-btn ss-btn-secundario" (click)="ref.close(false)">Cancelar</button>
        <button
          type="button"
          class="ss-btn"
          [class.ss-btn-peligro-lleno]="datos.peligro"
          [class.ss-btn-primario]="!datos.peligro"
          (click)="ref.close(true)">
          {{ datos.aceptar ?? 'Aceptar' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .caja {
      padding: 1.5rem;
      max-width: 380px;
    }
    .icono {
      display: inline-grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 12px;
      background: var(--ss-navy-soft);
      color: var(--ss-navy);
    }
    .icono.peligro {
      background: var(--ss-red-soft);
      color: var(--ss-red);
    }
    h2 {
      margin: 0.9rem 0 0.4rem;
      font-size: 1.1rem;
      color: var(--ss-navy);
    }
    p {
      margin: 0 0 1.25rem;
      font-size: 0.92rem;
      line-height: 1.5;
      color: var(--ss-text);
    }
    .pie {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `,
})
export class Confirmacion {
  protected readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<Confirmacion, boolean>);
}

@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private readonly dialogo = inject(MatDialog);

  preguntar(datos: DatosConfirmacion): Observable<boolean> {
    return this.dialogo
      .open(Confirmacion, { data: datos, autoFocus: false, panelClass: 'ss-dialogo' })
      .afterClosed()
      .pipe(map((respuesta) => respuesta === true));
  }
}
