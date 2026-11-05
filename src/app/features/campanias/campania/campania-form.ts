import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HabitoService } from '../habito/habito-service';
import { Habito } from '../habito/habito.model';
import { CampaniaService } from './campania-service';
import { CampaniaRequest, EstadoCampania } from './campania.model';
import { mensajeDeError } from '../../../shared/utilidades/errores';

interface Grupo {
  id: number;
  nombre: string;
  habitos: Habito[];
}

type Campo = 'nombre' | 'fechaInicio' | 'fechaFin' | 'maxEvidenciasDia' | 'estado';

@Component({
  selector: 'app-campania-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './campania-form.html',
  styleUrl: './campania-form.css',
})
export class CampaniaForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campaniaService = inject(CampaniaService);
  private readonly habitoService = inject(HabitoService);

  protected readonly estados: { valor: EstadoCampania; texto: string; ayuda: string }[] = [
    { valor: 'BORRADOR', texto: 'Borrador', ayuda: 'Se prepara sin que los estudiantes la vean' },
    { valor: 'ACTIVA', texto: 'Activa', ayuda: 'Los estudiantes registran en esta campaña' },
    { valor: 'CERRADA', texto: 'Cerrada', ayuda: 'Ya terminó, queda para reportes' },
  ];

  protected readonly id = signal<number | null>(null);
  protected readonly habitos = signal<Habito[]>([]);
  protected readonly elegidos = signal<Set<number>>(new Set());
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly intentado = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    maxEvidenciasDia: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
    estado: ['BORRADOR' as EstadoCampania, Validators.required],
  });

  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly fechasInvalidas = computed(() => {
    const { fechaInicio, fechaFin } = this.valores();
    return !!fechaInicio && !!fechaFin && fechaFin < fechaInicio;
  });

  protected readonly grupos = computed<Grupo[]>(() => {
    const mapa = new Map<number, Grupo>();
    const elegidos = this.elegidos();
    for (const habito of this.habitos().filter((h) => h.activo === 1 || elegidos.has(h.id))) {
      const grupo = mapa.get(habito.categoria.id) ?? {
        id: habito.categoria.id,
        nombre: habito.categoria.nombre,
        habitos: [],
      };
      grupo.habitos.push(habito);
      mapa.set(habito.categoria.id, grupo);
    }
    return [...mapa.values()];
  });

  ngOnInit(): void {
    this.habitoService.listar().subscribe({
      next: (data) => this.habitos.set(data),
      error: (err) => this.error.set(mensajeDeError(err, 'No se pudieron cargar los hábitos.')),
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.id.set(id);
      this.campaniaService.obtener(id).subscribe({
        next: (c) => {
          this.form.setValue({
            nombre: c.nombre,
            fechaInicio: c.fechaInicio.slice(0, 10),
            fechaFin: c.fechaFin.slice(0, 10),
            maxEvidenciasDia: c.maxEvidenciasDia,
            estado: c.estado,
          });
          this.elegidos.set(new Set(c.habitoIds));
        },
        error: (err) => this.error.set(mensajeDeError(err, 'No se encontró la campaña.')),
      });
    }
  }

  protected marcado(habito: Habito): boolean {
    return this.elegidos().has(habito.id);
  }

  protected alternar(habito: Habito): void {
    this.elegidos.update((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(habito.id)) nuevo.delete(habito.id);
      else nuevo.add(habito.id);
      return nuevo;
    });
  }

  protected cuantos(grupo: Grupo): number {
    return grupo.habitos.filter((h) => this.elegidos().has(h.id)).length;
  }

  protected todoElGrupo(grupo: Grupo): void {
    const completo = this.cuantos(grupo) === grupo.habitos.length;
    this.elegidos.update((actual) => {
      const nuevo = new Set(actual);
      for (const habito of grupo.habitos) {
        if (completo) nuevo.delete(habito.id);
        else nuevo.add(habito.id);
      }
      return nuevo;
    });
  }

  protected invalido(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || this.intentado());
  }

  protected guardar(): void {
    this.intentado.set(true);
    if (this.form.invalid || this.fechasInvalidas() || this.elegidos().size === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.guardando.set(true);
    const datos: CampaniaRequest = { ...this.form.getRawValue(), habitoIds: [...this.elegidos()] };
    const id = this.id();
    const peticion = id ? this.campaniaService.actualizar(id, datos) : this.campaniaService.crear(datos);
    peticion.subscribe({
      next: () => this.router.navigate(['/campanias']),
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(err, 'No se pudo guardar la campaña.'));
      },
    });
  }
}
