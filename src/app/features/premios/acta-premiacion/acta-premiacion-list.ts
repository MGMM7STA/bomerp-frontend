import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SedeService } from '../../../core/sede/sede-service';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion';
import { mensajeDeError } from '../../../shared/utilidades/errores';
import { CampaniaService } from '../../campanias/campania/campania-service';
import { Campania } from '../../campanias/campania/campania.model';
import { EstudianteService } from '../../participacion/estudiante/estudiante-service';
import { Estudiante } from '../../participacion/estudiante/estudiante.model';
import { PremioService } from '../premio/premio-service';
import { Premio } from '../premio/premio.model';
import { ActaPremiacionService } from './acta-premiacion-service';
import { ActaPremiacion } from './acta-premiacion.model';

interface Fila {
  clave: number;
  estudianteId: number | null;
  posicion: number;
  premioId: number | null;
  cantidad: number;
  puntajeAlcanzado: number;
}

let siguiente = 1;

@Component({
  selector: 'app-actas-premiacion',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './acta-premiacion-list.html',
  styleUrl: './acta-premiacion-list.css',
})
export class ActaPremiacionList implements OnInit {
  private readonly service = inject(ActaPremiacionService);
  private readonly campaniaService = inject(CampaniaService);
  private readonly estudianteService = inject(EstudianteService);
  private readonly premioService = inject(PremioService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly route = inject(ActivatedRoute);
  protected readonly sede = inject(SedeService);

  protected readonly actas = signal<ActaPremiacion[]>([]);
  protected readonly campanias = signal<Campania[]>([]);
  protected readonly estudiantes = signal<Estudiante[]>([]);
  protected readonly premios = signal<Premio[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly errorForm = signal<string | null>(null);
  protected readonly abierto = signal(false);
  protected readonly guardando = signal(false);
  protected readonly trayendo = signal(false);
  protected readonly seleccionada = signal<ActaPremiacion | null>(null);

  protected readonly campaniaId = signal<number | null>(null);
  protected readonly desde = signal('');
  protected readonly hasta = signal('');
  protected readonly cuantos = signal(3);
  protected readonly filas = signal<Fila[]>([]);

  private readonly mapaCampanias = computed(() => new Map(this.campanias().map((c) => [c.id, c])));
  private readonly mapaEstudiantes = computed(() => new Map(this.estudiantes().map((e) => [e.id, e])));
  private readonly mapaPremios = computed(() => new Map(this.premios().map((p) => [p.id, p])));

  protected readonly premiosActivos = computed(() => this.premios().filter((p) => p.activo && p.stock > 0));

  protected readonly totalPremios = computed(() =>
    this.filas().reduce((suma, f) => suma + (f.premioId ? f.cantidad : 0), 0),
  );

  protected readonly faltaStock = computed(() => {
    const pedidos = new Map<number, number>();
    for (const fila of this.filas()) {
      if (fila.premioId) pedidos.set(fila.premioId, (pedidos.get(fila.premioId) ?? 0) + fila.cantidad);
    }
    return [...pedidos]
      .filter(([id, cantidad]) => cantidad > (this.mapaPremios().get(id)?.stock ?? 0))
      .map(([id]) => this.nombrePremio(id));
  });

  ngOnInit(): void {
    forkJoin({
      campanias: this.campaniaService.listar(),
      estudiantes: this.estudianteService.listar(),
      premios: this.premioService.listar(),
    }).subscribe({
      next: ({ campanias, estudiantes, premios }) => {
        this.campanias.set(campanias);
        this.estudiantes.set([...estudiantes].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.premios.set(premios);
        if (this.route.snapshot.queryParamMap.get('nueva')) this.abrir();
      },
      error: (err) => this.error.set(mensajeDeError(err, 'No se pudieron cargar los datos para premiar.')),
    });
    this.listar();
  }

  protected listar(): void {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (data) => {
        this.actas.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las actas.'));
      },
    });
  }

  protected abrir(): void {
    const activa = this.campanias().find((c) => c.estado === 'ACTIVA') ?? this.campanias()[0];
    this.errorForm.set(null);
    this.aviso.set(null);
    this.filas.set([]);
    this.cuantos.set(3);
    this.elegirCampania(activa?.id ?? null);
    this.abierto.set(true);
  }

  protected cerrarForm(): void {
    this.abierto.set(false);
    this.guardando.set(false);
  }

  protected cambiarCampania(evento: Event): void {
    const valor = Number((evento.target as HTMLSelectElement).value);
    this.elegirCampania(valor || null);
    this.filas.set([]);
  }

  private elegirCampania(id: number | null): void {
    this.campaniaId.set(id);
    const campania = id ? this.mapaCampanias().get(id) : undefined;
    this.desde.set(campania?.fechaInicio.slice(0, 10) ?? '');
    this.hasta.set(campania?.fechaFin.slice(0, 10) ?? '');
  }

  protected escribirFecha(campo: 'desde' | 'hasta', evento: Event): void {
    this[campo].set((evento.target as HTMLInputElement).value);
  }

  protected escribirCuantos(evento: Event): void {
    const valor = Math.round(Number((evento.target as HTMLInputElement).value));
    this.cuantos.set(Math.min(20, Math.max(1, valor || 1)));
  }

  protected traerRanking(): void {
    const campaniaId = this.campaniaId();
    if (!campaniaId) {
      this.errorForm.set('Elige la campaña primero.');
      return;
    }
    this.trayendo.set(true);
    this.errorForm.set(null);
    this.estudianteService.ranking(this.cuantos(), campaniaId).subscribe({
      next: (ranking) => {
        this.trayendo.set(false);
        if (ranking.filas.length === 0) {
          this.errorForm.set('Esta campaña todavía no tiene puntos validados en la sede.');
          return;
        }
        const anteriores = new Map(this.filas().map((f) => [f.estudianteId, f]));
        this.filas.set(
          ranking.filas.map((r) => ({
            clave: siguiente++,
            estudianteId: r.estudianteId,
            posicion: r.posicion,
            premioId: anteriores.get(r.estudianteId)?.premioId ?? null,
            cantidad: anteriores.get(r.estudianteId)?.cantidad ?? 1,
            puntajeAlcanzado: Number(r.puntos),
          })),
        );
      },
      error: (err) => {
        this.trayendo.set(false);
        this.errorForm.set(mensajeDeError(err, 'No se pudo leer el ranking.'));
      },
    });
  }

  protected agregarFila(): void {
    const ultima = this.filas().at(-1);
    this.filas.update((lista) => [
      ...lista,
      {
        clave: siguiente++,
        estudianteId: null,
        posicion: (ultima?.posicion ?? 0) + 1,
        premioId: null,
        cantidad: 1,
        puntajeAlcanzado: 0,
      },
    ]);
  }

  protected quitarFila(fila: Fila): void {
    this.filas.update((lista) => lista.filter((f) => f.clave !== fila.clave));
  }

  protected cambiar(fila: Fila, campo: 'estudianteId' | 'premioId' | 'posicion' | 'cantidad' | 'puntajeAlcanzado', evento: Event): void {
    const crudo = (evento.target as HTMLInputElement | HTMLSelectElement).value;
    const numero = Number(crudo);
    const valor = campo === 'estudianteId' || campo === 'premioId' ? numero || null : numero;
    this.filas.update((lista) => lista.map((f) => (f.clave === fila.clave ? { ...f, [campo]: valor } : f)));
  }

  protected emitir(): void {
    const campaniaId = this.campaniaId();
    const filas = this.filas();
    if (!campaniaId) return this.errorForm.set('Elige la campaña.');
    if (!this.desde() || !this.hasta()) return this.errorForm.set('Completa las fechas del periodo.');
    if (this.desde() > this.hasta()) return this.errorForm.set('La fecha de inicio no puede ser posterior a la final.');
    if (filas.length === 0) return this.errorForm.set('Agrega al menos un ganador.');
    if (filas.some((f) => !f.estudianteId || !f.premioId)) return this.errorForm.set('Cada ganador necesita estudiante y premio.');
    if (filas.some((f) => !Number.isInteger(f.posicion) || f.posicion < 1 || !Number.isInteger(f.cantidad) || f.cantidad < 1)) {
      return this.errorForm.set('Revisa los puestos y cantidades: deben ser números enteros desde 1.');
    }
    if (new Set(filas.map((f) => f.estudianteId)).size !== filas.length) {
      return this.errorForm.set('Un estudiante aparece dos veces.');
    }
    if (this.faltaStock().length > 0) {
      return this.errorForm.set(`No alcanza el stock de: ${this.faltaStock().join(', ')}.`);
    }

    this.guardando.set(true);
    this.errorForm.set(null);
    this.service
      .emitir({
        campaniaId,
        fechaInicioPeriodo: this.desde(),
        fechaFinPeriodo: this.hasta(),
        detalles: filas.map((f) => ({
          estudianteId: f.estudianteId!,
          posicion: f.posicion,
          premioId: f.premioId!,
          cantidad: f.cantidad,
          puntajeAlcanzado: f.puntajeAlcanzado,
        })),
      })
      .subscribe({
        next: (acta) => {
          this.cerrarForm();
          this.aviso.set(`Emitiste el acta N.º ${acta.id} con ${acta.totalGanadores} ${acta.totalGanadores === 1 ? 'ganador' : 'ganadores'}. El stock de premios ya se descontó.`);
          this.premioService.listar().subscribe((data) => this.premios.set(data));
          this.listar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorForm.set(mensajeDeError(err, 'No se pudo emitir el acta.'));
        },
      });
  }

  protected ver(acta: ActaPremiacion): void {
    this.seleccionada.set(this.seleccionada()?.id === acta.id ? null : acta);
  }

  protected anular(acta: ActaPremiacion): void {
    this.confirmacion
      .preguntar({
        titulo: `Anular acta N.º ${acta.id}`,
        mensaje: 'Los premios vuelven al stock y el acta queda como anulada. No se puede deshacer.',
        aceptar: 'Anular',
        icono: 'block',
        peligro: true,
      })
      .subscribe((si) => {
        if (!si) return;
        this.error.set(null);
        this.service.anular(acta.id).subscribe({
          next: (actualizada) => {
            this.actas.update((lista) => lista.map((a) => (a.id === actualizada.id ? actualizada : a)));
            if (this.seleccionada()?.id === actualizada.id) this.seleccionada.set(actualizada);
            this.aviso.set(`Anulaste el acta N.º ${acta.id}. Los premios volvieron al stock.`);
            this.premioService.listar().subscribe((data) => this.premios.set(data));
          },
          error: (err) => this.error.set(mensajeDeError(err, 'No se pudo anular el acta.')),
        });
      });
  }

  protected nombreCampania(id: number): string {
    return this.mapaCampanias().get(id)?.nombre ?? `Campaña ${id}`;
  }

  protected nombreEstudiante(id: number | null): string {
    return (id && this.mapaEstudiantes().get(id)?.nombre) || `Estudiante ${id ?? ''}`;
  }

  protected nombrePremio(id: number | null): string {
    return (id && this.mapaPremios().get(id)?.nombre) || `Premio ${id ?? ''}`;
  }

  protected stock(id: number | null): number | null {
    return id ? this.mapaPremios().get(id)?.stock ?? null : null;
  }

  protected fecha(valor: string): Date {
    const [anio, mes, dia] = valor.slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }
}
