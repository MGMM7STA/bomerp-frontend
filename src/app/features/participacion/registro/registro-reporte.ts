import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { RegistroService } from './registro-service';
import { RegistroResponse } from './registro.model';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-registro-reporte',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './registro-reporte.html',
})
export class RegistroReporteComponent implements OnInit {
  private readonly registroService = inject(RegistroService);
  protected readonly auth = inject(AuthService);

  protected readonly registros = signal<RegistroResponse[]>([]);
  protected readonly estadoFiltro = signal('');
  protected readonly desdeFiltro = signal('');
  protected readonly hastaFiltro = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly totalRegistros = computed(() => this.registros().length);

  protected readonly evidenciasTotales = computed(() =>
    this.registros().reduce((suma, r) => suma + r.totalEvidencias, 0),
  );

  protected readonly puntajeAcumulado = computed(() =>
    this.registros().reduce((suma, r) => suma + r.puntajeTotal, 0),
  );

  protected readonly puntajePromedio = computed(() =>
    this.totalRegistros() === 0 ? 0 : this.puntajeAcumulado() / this.totalRegistros(),
  );

  protected readonly habitoMasRegistrado = computed(() => {
    const conteo = new Map<string, number>();
    for (const registro of this.registros()) {
      for (const detalle of registro.detalles) {
        conteo.set(detalle.nombreHabito, (conteo.get(detalle.nombreHabito) ?? 0) + detalle.veces);
      }
    }
    let nombre = '-';
    let mayor = 0;
    for (const [clave, valor] of conteo) {
      if (valor > mayor) {
        mayor = valor;
        nombre = clave;
      }
    }
    return mayor === 0 ? '-' : `${nombre} (${mayor})`;
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    const desde = this.desdeFiltro() ? `${this.desdeFiltro()}T00:00:00` : undefined;
    const hasta = this.hastaFiltro() ? `${this.hastaFiltro()}T23:59:59` : undefined;
    this.registroService
      .buscar(this.estadoFiltro() || undefined, undefined, desde, hasta)
      .subscribe({
        next: (data) => this.registros.set(data),
        error: () => this.error.set('No se pudo cargar el reporte de participacion.'),
        complete: () => this.loading.set(false),
      });
  }

  protected filtrarPorEstado(estado: string): void {
    this.estadoFiltro.set(estado);
    this.aviso.set(null);
    this.cargar();
  }

  protected aplicarRangoFechas(desde: string, hasta: string): void {
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha inicial no puede ser mayor que la final.');
      return;
    }
    this.desdeFiltro.set(desde);
    this.hastaFiltro.set(hasta);
    this.aviso.set(null);
    this.cargar();
  }

  protected limpiarFiltros(): void {
    this.estadoFiltro.set('');
    this.desdeFiltro.set('');
    this.hastaFiltro.set('');
    this.aviso.set(null);
    this.cargar();
  }

  protected anular(registro: RegistroResponse): void {
    const resumen =
      `Vas a anular el registro ${registro.id} del estudiante ${registro.estudianteId}\n\n` +
      `Evidencias: ${registro.totalEvidencias}\n` +
      `Puntaje: ${registro.puntajeTotal.toFixed(2)} pts\n\n` +
      `Se devolvera el cupo diario consumido por sus evidencias. Esta accion no se puede deshacer. Confirmar?`;
    if (!confirm(resumen)) return;

    this.error.set(null);
    this.aviso.set(null);
    this.registroService.anular(registro.id).subscribe({
      next: (actualizado) => {
        this.aviso.set(
          `Registro ${actualizado.id} anulado. Se devolvieron ${registro.totalEvidencias} evidencia(s) al cupo diario.`,
        );
        this.cargar();
      },
      error: (err: HttpErrorResponse) => this.manejarErrorAnulacion(err, registro.id),
    });
  }

  private manejarErrorAnulacion(err: HttpErrorResponse, id: number): void {
    const mensaje: string = err.error?.message ?? '';

    if (err.status === 409) {
      this.error.set(mensaje || `El registro ${id} ya estaba anulado, no se puede anular dos veces.`);
    } else if (err.status === 404 && mensaje.includes('cupo diario')) {
      this.error.set(
        `El registro ${id} no tiene un cupo diario asociado, asi que no hay nada que devolver.`,
      );
    } else if (err.status === 404) {
      this.error.set(`El registro ${id} ya no existe.`);
    } else {
      this.error.set('No se pudo anular el registro.');
    }
  }
}
