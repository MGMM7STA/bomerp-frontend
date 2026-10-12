import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HabitoService } from '../../campanias/habito/habito-service';
import { Habito } from '../../campanias/habito/habito.model';
import { RegistroService } from './registro-service';

@Component({
  selector: 'app-registro-form',
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './registro-form.html',
})
export class RegistroForm {
  private readonly fb = inject(FormBuilder);
  private readonly habitoService = inject(HabitoService);
  private readonly registroService = inject(RegistroService);
  private readonly router = inject(Router);

  protected readonly habitos = signal<Habito[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    estudianteId: [1, [Validators.required, Validators.min(1)]],
    detalles: this.fb.array([this.crearLinea()], [Validators.minLength(1)]),
  });

  protected readonly valoresDetalles = toSignal(this.form.controls.detalles.valueChanges, {
    initialValue: this.form.controls.detalles.getRawValue(),
  });

  protected readonly puntajesUnitarios = computed(() =>
    this.valoresDetalles().map((linea) => {
      const habito = this.habitos().find((h) => h.id === linea.habitoId);
      return habito?.puntajeBase ?? 0;
    }),
  );

  protected readonly subtotales = computed(() =>
    this.valoresDetalles().map((linea) => {
      const habito = this.habitos().find((h) => h.id === linea.habitoId);
      return (habito?.puntajeBase ?? 0) * (linea.veces ?? 0);
    }),
  );

  protected readonly opcionesPorLinea = computed(() =>
    this.valoresDetalles().map((linea) => {
      const valor: unknown = linea.busqueda;
      const texto = (typeof valor === 'string' ? valor : '').toLowerCase();
      return this.habitos().filter((h) => h.nombre.toLowerCase().includes(texto));
    }),
  );

  protected readonly puntajeTotal = computed(() =>
    this.subtotales().reduce((suma, s) => suma + s, 0),
  );

  protected readonly totalEvidencias = computed(() =>
    this.valoresDetalles().reduce((suma, linea) => suma + (linea.veces ?? 0), 0),
  );

  protected readonly coleccionValida = computed(() =>
    this.valoresDetalles().length > 0 &&
    this.valoresDetalles().every((linea) => (linea.habitoId ?? 0) > 0 && (linea.veces ?? 0) > 0),
  );

  constructor() {
    this.habitoService.listar().subscribe({
      next: (data) => this.habitos.set(data.filter((h) => h.activo === 1)),
      error: () => this.error.set('No se pudieron cargar los habitos.'),
    });
  }

  protected agregarLinea(): void {
    this.lineasForm.push(this.crearLinea());
  }

  protected quitarLinea(indice: number): void {
    if (this.lineasForm.length > 1) {
      this.lineasForm.removeAt(indice);
    }
  }

  protected seleccionarHabito(indice: number, evento: MatAutocompleteSelectedEvent): void {
    const habito: Habito = evento.option.value;
    this.lineasForm.at(indice).patchValue({ habitoId: habito.id, busqueda: habito.nombre });
  }

  protected confirmarYGuardar(): void {
    if (this.form.invalid || !this.coleccionValida()) {
      this.form.markAllAsTouched();
      this.error.set(
        'Revisa el registro: necesitas al menos una evidencia, cada una con un habito elegido de la lista y un numero de veces de al menos 1.',
      );
      return;
    }
    this.error.set(null);

    const lineas = this.lineasForm.getRawValue();
    const detalle = lineas
      .map((l) => {
        const habito = this.habitos().find((h) => h.id === l.habitoId);
        return `  - ${habito?.nombre ?? 'habito ' + l.habitoId} x${l.veces}`;
      })
      .join('\n');

    const resumen =
      `Vas a registrar la participacion del estudiante ${this.form.controls.estudianteId.value}\n\n` +
      `${detalle}\n\n` +
      `Evidencias: ${this.totalEvidencias()}\n` +
      `Puntaje total: ${this.puntajeTotal().toFixed(2)} pts\n\n` +
      `Esta operacion consume tu cupo diario. Confirmar?`;

    if (!confirm(resumen)) return;
    this.guardar();
  }

  private guardar(): void {
    this.error.set(null);
    this.loading.set(true);
    const detalles = this.lineasForm.getRawValue().map(({ habitoId, veces, descripcion, urlImagen }) => ({
      habitoId,
      veces,
      descripcion: descripcion || undefined,
      urlImagen: urlImagen || undefined,
    }));
    this.registroService
      .crear({ estudianteId: this.form.controls.estudianteId.value, detalles })
      .subscribe({
        next: () => this.router.navigate(['/participacion/reporte']),
        error: (err: HttpErrorResponse) => this.manejarErrorGuardado(err),
      });
  }

  private manejarErrorGuardado(err: HttpErrorResponse): void {
    const mensaje: string = err.error?.message ?? '';

    if (err.status === 404 && mensaje.startsWith('Habito no encontrado')) {
      this.error.set('Uno de los habitos elegidos ya no existe. Revisa las evidencias del registro.');
    } else if (err.status === 404 && mensaje.includes('campania')) {
      this.error.set('No hay una campania activa en este momento, asi que no se puede registrar participacion.');
    } else if (err.status === 409) {
      this.error.set(mensaje || 'Superaste el cupo diario de evidencias de la campania.');
    } else if (err.status === 400) {
      this.error.set('Los datos enviados no son validos. Revisa las evidencias del registro.');
    } else {
      this.error.set('No se pudo registrar la participacion.');
    }
    this.loading.set(false);
  }

  protected get lineasForm() {
    return this.form.controls.detalles;
  }

  private crearLinea() {
    return this.fb.nonNullable.group({
      habitoId: [0, [Validators.min(1)]],
      busqueda: [''],
      veces: [1, [Validators.required, Validators.min(1)]],
      descripcion: [''],
      urlImagen: [''],
    });
  }
}
