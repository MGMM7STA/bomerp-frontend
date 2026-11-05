import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CampaniaService } from '../../campanias/campania/campania-service';
import { Campania } from '../../campanias/campania/campania.model';
import { Habito } from '../../campanias/habito/habito.model';
import { consumeCupo } from '../../../shared/utilidades/estados';
import { mensajeDeError } from '../../../shared/utilidades/errores';
import { claveDia } from '../../../core/inicio/fechas';
import { RegistroService } from './registro-service';
import { RegistroResponse } from './registro.model';

interface Linea {
  habito: Habito;
  veces: number;
  descripcion: string;
  urlImagen: string;
}

type Paso = 1 | 2 | 3;

@Component({
  selector: 'app-registro-form',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './registro-form.html',
  styleUrl: './registro-form.css',
})
export class RegistroForm implements OnInit {
  private readonly campaniaService = inject(CampaniaService);
  private readonly registroService = inject(RegistroService);

  protected readonly pasos = [
    { numero: 1, texto: 'Hábitos' },
    { numero: 2, texto: 'Detalle' },
    { numero: 3, texto: 'Confirmar' },
  ];

  protected readonly campania = signal<Campania | null>(null);
  protected readonly habitos = signal<Habito[]>([]);
  protected readonly registros = signal<RegistroResponse[]>([]);
  protected readonly cargando = signal(true);
  protected readonly sinCampania = signal(false);
  protected readonly paso = signal<Paso>(1);
  protected readonly lineas = signal<Linea[]>([]);
  protected readonly categoriaFiltro = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly creado = signal<RegistroResponse | null>(null);

  protected readonly categorias = computed(() => {
    const vistas = new Map<number, string>();
    for (const habito of this.habitos()) {
      vistas.set(habito.categoria.id, habito.categoria.nombre);
    }
    return [...vistas].map(([id, nombre]) => ({ id, nombre }));
  });

  protected readonly habitosVisibles = computed(() => {
    const filtro = this.categoriaFiltro();
    return filtro === null
      ? this.habitos()
      : this.habitos().filter((habito) => habito.categoria.id === filtro);
  });

  protected readonly maximo = computed(() => this.campania()?.maxEvidenciasDia ?? 0);

  protected readonly usadasHoy = computed(() => {
    const hoy = claveDia(new Date());
    return this.registros()
      .filter((r) => consumeCupo(r.estado) && r.fecha.slice(0, 10) === hoy)
      .reduce((suma, r) => suma + r.totalEvidencias, 0);
  });

  protected readonly restantesHoy = computed(() => Math.max(0, this.maximo() - this.usadasHoy()));

  protected readonly totalVeces = computed(() =>
    this.lineas().reduce((suma, linea) => suma + linea.veces, 0),
  );

  protected readonly puntaje = computed(() =>
    this.lineas().reduce((suma, linea) => suma + linea.habito.puntajeBase * linea.veces, 0),
  );

  protected readonly excede = computed(() => this.totalVeces() > this.restantesHoy());

  protected readonly puedeSeguir = computed(() => {
    if (this.paso() === 1) return this.lineas().length > 0;
    return this.lineas().length > 0 && !this.excede() && this.lineas().every((l) => l.veces > 0);
  });

  ngOnInit(): void {
    this.campaniaService.obtenerActiva().subscribe({
      next: (data) => this.campania.set(data),
      error: () => {
        this.sinCampania.set(true);
        this.cargando.set(false);
      },
    });
    this.campaniaService.habitosDeActiva().subscribe({
      next: (data) => {
        this.habitos.set(data.filter((habito) => habito.activo === 1));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
    this.registroService.buscar().subscribe({
      next: (data) => this.registros.set(data),
    });
  }

  protected seleccionado(habito: Habito): boolean {
    return this.lineas().some((linea) => linea.habito.id === habito.id);
  }

  protected alternar(habito: Habito): void {
    this.lineas.update((lista) =>
      lista.some((linea) => linea.habito.id === habito.id)
        ? lista.filter((linea) => linea.habito.id !== habito.id)
        : [...lista, { habito, veces: 1, descripcion: '', urlImagen: '' }],
    );
  }

  protected filtrar(categoriaId: number | null): void {
    this.categoriaFiltro.set(categoriaId);
  }

  protected cambiarVeces(indice: number, delta: number): void {
    this.lineas.update((lista) =>
      lista.map((linea, i) =>
        i === indice ? { ...linea, veces: Math.max(1, linea.veces + delta) } : linea,
      ),
    );
  }

  protected escribir(indice: number, campo: 'descripcion' | 'urlImagen', evento: Event): void {
    const valor = (evento.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.lineas.update((lista) =>
      lista.map((linea, i) => (i === indice ? { ...linea, [campo]: valor } : linea)),
    );
  }

  protected quitar(indice: number): void {
    this.lineas.update((lista) => lista.filter((_, i) => i !== indice));
    if (this.lineas().length === 0) {
      this.paso.set(1);
    }
  }

  protected irA(paso: Paso): void {
    if (paso > this.paso() && !this.puedeSeguir()) return;
    this.error.set(null);
    this.paso.set(paso);
  }

  protected siguiente(): void {
    if (this.paso() < 3) {
      this.irA((this.paso() + 1) as Paso);
    }
  }

  protected anterior(): void {
    if (this.paso() > 1) {
      this.irA((this.paso() - 1) as Paso);
    }
  }

  protected enviar(): void {
    if (!this.puedeSeguir() || this.enviando()) return;
    this.error.set(null);
    this.enviando.set(true);
    const detalles = this.lineas().map((linea) => ({
      habitoId: linea.habito.id,
      veces: linea.veces,
      descripcion: linea.descripcion.trim() || undefined,
      urlImagen: linea.urlImagen.trim() || undefined,
    }));
    this.registroService.crear({ detalles }).subscribe({
      next: (registro) => {
        this.creado.set(registro);
        this.enviando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        if (err.status === 409) {
          this.error.set(
            'Ya no te alcanza el cupo de hoy. Puede que hayas registrado desde otra pestaña: reduce las veces o vuelve mañana.',
          );
          this.registroService.buscar().subscribe({ next: (data) => this.registros.set(data) });
          this.paso.set(2);
        } else {
          this.error.set(mensajeDeError(err, 'No se pudo enviar tu registro. Inténtalo otra vez.'));
        }
      },
    });
  }

  protected nuevoRegistro(): void {
    this.creado.set(null);
    this.lineas.set([]);
    this.paso.set(1);
    this.registroService.buscar().subscribe({ next: (data) => this.registros.set(data) });
  }
}
