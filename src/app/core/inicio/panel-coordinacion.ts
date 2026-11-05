import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaniaService } from '../../features/campanias/campania/campania-service';
import { Campania } from '../../features/campanias/campania/campania.model';
import { RegistroService } from '../../features/participacion/registro/registro-service';
import { RegistroResponse } from '../../features/participacion/registro/registro.model';
import { claveDia, diasRestantes, etiquetaDia, fechaCorta } from './fechas';

interface Barra {
  etiqueta: string;
  valor: number;
  porcentaje: number;
}

@Component({
  selector: 'app-panel-coordinacion',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './panel-coordinacion.html',
  styleUrl: './panel-coordinacion.css',
})
export class PanelCoordinacion implements OnInit {
  private readonly campaniaService = inject(CampaniaService);
  private readonly registroService = inject(RegistroService);

  protected readonly campania = signal<Campania | null>(null);
  protected readonly registros = signal<RegistroResponse[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly vigentes = computed(() =>
    this.registros().filter((r) => r.estado !== 'ANULADO'),
  );

  private readonly validados = computed(() =>
    this.registros().filter((r) => r.estado === 'VALIDADO'),
  );

  protected readonly participantes = computed(
    () => new Set(this.vigentes().map((r) => r.estudianteId)).size,
  );

  protected readonly evidenciasValidas = computed(() =>
    this.validados().reduce((suma, r) => suma + r.totalEvidencias, 0),
  );

  protected readonly porRevisar = computed(
    () => this.registros().filter((r) => r.estado === 'ENVIADO').length,
  );

  protected readonly promedio = computed(() =>
    this.participantes() === 0 ? 0 : this.evidenciasValidas() / this.participantes(),
  );

  protected readonly periodo = computed(() => {
    const c = this.campania();
    return c ? `del ${fechaCorta(c.fechaInicio)} al ${fechaCorta(c.fechaFin)}` : '';
  });

  protected readonly quedan = computed(() => {
    const c = this.campania();
    return c ? diasRestantes(c.fechaFin) : 0;
  });

  protected readonly porHabito = computed<Barra[]>(() => {
    const conteo = new Map<string, number>();
    for (const registro of this.validados()) {
      for (const detalle of registro.detalles) {
        conteo.set(detalle.nombreHabito, (conteo.get(detalle.nombreHabito) ?? 0) + detalle.veces);
      }
    }
    return this.aBarras([...conteo].sort((a, b) => b[1] - a[1]));
  });

  protected readonly porDia = computed<Barra[]>(() => {
    const dias = new Map<string, number>();
    const hoy = new Date();
    for (let atras = 6; atras >= 0; atras--) {
      const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - atras);
      dias.set(claveDia(dia), 0);
    }
    for (const registro of this.vigentes()) {
      const clave = registro.fecha.slice(0, 10);
      if (dias.has(clave)) {
        dias.set(clave, (dias.get(clave) ?? 0) + registro.totalEvidencias);
      }
    }
    return this.aBarras([...dias].map(([clave, valor]) => [etiquetaDia(clave), valor]));
  });

  ngOnInit(): void {
    this.campaniaService.obtenerActiva().subscribe({
      next: (data) => this.campania.set(data),
      error: () => this.campania.set(null),
    });
    this.registroService.buscar().subscribe({
      next: (data) => this.registros.set(data),
      error: () => {
        this.error.set('No se pudo cargar la participación de la campaña.');
        this.cargando.set(false);
      },
      complete: () => this.cargando.set(false),
    });
  }

  private aBarras(pares: [string, number][]): Barra[] {
    const mayor = Math.max(1, ...pares.map(([, valor]) => valor));
    return pares.map(([etiqueta, valor]) => ({
      etiqueta,
      valor,
      porcentaje: Math.round((valor / mayor) * 100),
    }));
  }
}
