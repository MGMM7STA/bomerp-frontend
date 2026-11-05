import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaniaService } from './campania-service';
import { Campania, EstadoCampania } from './campania.model';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion';
import { mensajeDeError } from '../../../shared/utilidades/errores';
import { aFechaLocal } from '../../../core/inicio/fechas';

const ESTADOS: Record<EstadoCampania, { texto: string; clase: string }> = {
  ACTIVA: { texto: 'Activa', clase: 'ss-badge-ok' },
  BORRADOR: { texto: 'Borrador', clase: 'ss-badge-gris' },
  CERRADA: { texto: 'Cerrada', clase: 'ss-badge-info' },
};

@Component({
  selector: 'app-campania-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './campania-list.html',
})
export class CampaniaList implements OnInit {
  private readonly campaniaService = inject(CampaniaService);
  private readonly confirmacion = inject(ConfirmacionService);

  protected readonly campanias = signal<Campania[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly fecha = aFechaLocal;

  ngOnInit(): void {
    this.cargar();
  }

  protected estado(estado: EstadoCampania) {
    return ESTADOS[estado] ?? ESTADOS.BORRADOR;
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.campaniaService.listar().subscribe({
      next: (data) => {
        this.campanias.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las campañas.'));
        this.cargando.set(false);
      },
    });
  }

  protected eliminar(campania: Campania): void {
    this.confirmacion
      .preguntar({
        titulo: 'Eliminar campaña',
        mensaje: `Se eliminará "${campania.nombre}". Si ya tiene registros de estudiantes no se podrá borrar.`,
        aceptar: 'Eliminar',
        peligro: true,
      })
      .subscribe((si) => {
        if (!si) return;
        this.error.set(null);
        this.campaniaService.eliminar(campania.id).subscribe({
          next: () => this.cargar(),
          error: (err) => this.error.set(mensajeDeError(err, 'No se pudo eliminar la campaña.')),
        });
      });
  }
}
