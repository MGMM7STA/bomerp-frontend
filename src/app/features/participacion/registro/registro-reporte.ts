import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { RegistroService } from './registro-service';
import { RegistroResponse } from './registro.model';
import { AuthService } from '../../../core/auth/auth-service';
import { EstudianteService } from '../estudiante/estudiante-service';
import { Estudiante } from '../estudiante/estudiante.model';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion';
import { estiloEstado } from '../../../shared/utilidades/estados';

@Component({
  selector: 'app-registro-reporte',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './registro-reporte.html',
  styleUrl: './registro-reporte.css',
})
export class RegistroReporteComponent implements OnInit {
  private readonly registroService = inject(RegistroService);
  protected readonly auth = inject(AuthService);
  private readonly estudianteService = inject(EstudianteService);
  private readonly confirmacion = inject(ConfirmacionService);
  protected readonly estilo = estiloEstado;
  protected readonly estudiantes = signal<Map<number, Estudiante>>(new Map());

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
    this.registros()
      .filter((r) => r.estado === 'VALIDADO')
      .reduce((suma, r) => suma + Number(r.puntajeTotal), 0),
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
    this.estudianteService.listar().subscribe({
      next: (data) => this.estudiantes.set(new Map(data.map((e) => [e.id, e]))),
    });
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
        error: () => {
          this.error.set('No se pudo cargar el reporte de participación.');
          this.loading.set(false);
        },
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

  protected nombre(registro: RegistroResponse): string {
    return this.estudiantes().get(registro.estudianteId)?.nombre ?? `Estudiante #${registro.estudianteId}`;
  }

  protected anular(registro: RegistroResponse): void {
    this.confirmacion
      .preguntar({
        titulo: `Anular registro #${registro.id}`,
        mensaje: `Es de ${this.nombre(registro)}, con ${registro.totalEvidencias} evidencias. Se le devuelve el cupo de ese día y no se puede deshacer.`,
        aceptar: 'Anular registro',
        icono: 'block',
        peligro: true,
      })
      .subscribe((si) => {
        if (si) this.confirmarAnulacion(registro);
      });
  }

  private confirmarAnulacion(registro: RegistroResponse): void {
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
        `El registro ${id} no tiene un cupo diario asociado, así que no hay nada que devolver.`,
      );
    } else if (err.status === 404) {
      this.error.set(`El registro ${id} ya no existe.`);
    } else {
      this.error.set('No se pudo anular el registro.');
    }
  }
}
