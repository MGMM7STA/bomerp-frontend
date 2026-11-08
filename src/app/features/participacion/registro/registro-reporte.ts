import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FiltrosRegistro, RegistroService } from './registro-service';
import { RegistroResponse, RegistroTotales } from './registro.model';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../core/auth/auth-service';
import { EstudianteService } from '../estudiante/estudiante-service';
import { SedeService } from '../../../core/sede/sede-service';
import { Estudiante } from '../estudiante/estudiante.model';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion';
import { estiloEstado } from '../../../shared/utilidades/estados';

@Component({
  selector: 'app-registro-reporte',
  imports: [DatePipe, DecimalPipe, RouterLink, MatSelectModule],
  templateUrl: './registro-reporte.html',
  styleUrl: './registro-reporte.css',
})
export class RegistroReporteComponent implements OnInit {
  private readonly registroService = inject(RegistroService);
  protected readonly auth = inject(AuthService);
  private readonly estudianteService = inject(EstudianteService);
  protected readonly sede = inject(SedeService);
  private readonly confirmacion = inject(ConfirmacionService);
  protected readonly estilo = estiloEstado;
  protected readonly estudiantes = signal<Map<number, Estudiante>>(new Map());

  protected readonly registros = signal<RegistroResponse[]>([]);
  protected readonly totales = signal<RegistroTotales | null>(null);
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly totalElementos = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly tamanios = [5, 10, 20, 50];
  protected readonly estadoFiltro = signal('');
  protected readonly desdeFiltro = signal('');
  protected readonly hastaFiltro = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly desdeFila = computed(() =>
    this.totalElementos() === 0 ? 0 : this.pagina() * this.tamanio() + 1,
  );
  protected readonly hastaFila = computed(() =>
    Math.min((this.pagina() + 1) * this.tamanio(), this.totalElementos()),
  );

  protected readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.pagina();
    const inicio = Math.max(0, Math.min(actual - 2, total - 5));
    return Array.from({ length: Math.min(5, total) }, (_, i) => inicio + i);
  });

  ngOnInit(): void {
    this.estudianteService.listar().subscribe({
      next: (data) => this.estudiantes.set(new Map(data.map((e) => [e.id, e]))),
    });
    this.cargar();
  }

  private filtros(): FiltrosRegistro {
    return {
      estado: this.estadoFiltro() || undefined,
      desde: this.desdeFiltro() ? `${this.desdeFiltro()}T00:00:00` : undefined,
      hasta: this.hastaFiltro() ? `${this.hastaFiltro()}T23:59:59` : undefined,
    };
  }

  protected cargar(): void {
    this.cargarTotales();
    this.cargarPagina();
  }

  private cargarTotales(): void {
    this.registroService.totales(this.filtros()).subscribe({
      next: (data) => this.totales.set(data),
      error: () => this.totales.set(null),
    });
  }

  protected cargarPagina(): void {
    this.loading.set(true);
    this.error.set(null);
    this.registroService.buscarPagina(this.filtros(), this.pagina(), this.tamanio()).subscribe({
      next: (data) => {
        this.registros.set(data.contenido);
        this.totalElementos.set(data.totalElementos);
        this.totalPaginas.set(data.totalPaginas);
        this.loading.set(false);
        if (data.contenido.length === 0 && data.pagina > 0) this.irA(data.pagina - 1);
      },
      error: () => {
        this.error.set('No se pudo cargar el reporte de participación.');
        this.loading.set(false);
      },
    });
  }

  protected irA(pagina: number): void {
    if (pagina < 0 || (this.totalPaginas() > 0 && pagina >= this.totalPaginas())) return;
    this.pagina.set(pagina);
    this.cargarPagina();
  }

  protected cambiarTamanio(tamanio: number): void {
    this.tamanio.set(tamanio);
    this.pagina.set(0);
    this.cargarPagina();
  }

  protected filtrarPorEstado(estado: string): void {
    this.estadoFiltro.set(estado);
    this.pagina.set(0);
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
    this.pagina.set(0);
    this.aviso.set(null);
    this.cargar();
  }

  protected limpiarFiltros(): void {
    this.estadoFiltro.set('');
    this.desdeFiltro.set('');
    this.hastaFiltro.set('');
    this.pagina.set(0);
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
