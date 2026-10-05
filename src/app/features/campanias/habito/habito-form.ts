import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CategoriaHabitoService } from '../categoria-habito/categoria-habito-service';
import { CategoriaHabito } from '../categoria-habito/categoria-habito.model';
import { HabitoService } from './habito-service';
import { MensajeError } from '../../../shared/mensaje-error/mensaje-error';

@Component({
  selector: 'app-habito-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MensajeError,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './habito-form.html',
})
export class HabitoForm {
  private readonly fb = inject(FormBuilder);
  private readonly habitoService = inject(HabitoService);
  private readonly categoriaHabitoService = inject(CategoriaHabitoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly id = signal<number | null>(null);
  protected readonly categorias = signal<CategoriaHabito[]>([]);
  protected readonly categoriasCargadas = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorCarga = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    categoriaId: [0, [Validators.min(1)]],
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.maxLength(255)]],
    puntajeBase: [1, [Validators.required, Validators.min(0.01)]],
    activo: [1, [Validators.required]],
  });

  constructor() {
    this.cargarCategorias();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.id.set(id);
      this.loading.set(true);
      this.habitoService.obtener(id).subscribe({
        next: (habito) => {
          this.form.patchValue({
            categoriaId: habito.categoria.id,
            nombre: habito.nombre,
            descripcion: habito.descripcion ?? '',
            puntajeBase: habito.puntajeBase,
            activo: habito.activo,
          });
          this.loading.set(false);
        },
        error: () => {
          this.errorCarga.set(true);
          this.error.set('No se pudo cargar el habito.');
          this.loading.set(false);
        },
      });
    }
  }

  private cargarCategorias(): void {
    this.categoriaHabitoService.listar().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.categoriasCargadas.set(true);
      },
      error: () => this.error.set('No se pudieron cargar las categorias de habito.'),
    });
  }

  guardar(): void {
    if (this.loading() || this.errorCarga()) return;

    this.error.set(null);

    const nombre = this.form.controls.nombre;
    nombre.setValue(nombre.value.trim());

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();
    const id = this.id();
    const peticion = id
      ? this.habitoService.actualizar(id, valor)
      : this.habitoService.crear(valor);

    this.loading.set(true);
    peticion.subscribe({
      next: () => this.router.navigate(['/campanias/habitos']),
      error: (err: HttpErrorResponse) => this.manejarErrorGuardado(err),
    });
  }

  cancelar(): void {
    this.router.navigate(['/campanias/habitos']);
  }

  private manejarErrorGuardado(err: HttpErrorResponse): void {
    const mensaje: string = err.error?.message ?? '';

    if (err.status === 404 && mensaje.startsWith('Categoria')) {
      this.error.set('La categoria de habito seleccionada ya no existe. Elige otra de la lista.');
      this.form.controls.categoriaId.setValue(0);
      this.cargarCategorias();
    } else if (err.status === 404) {
      this.error.set('El habito ya no existe.');
    } else if (err.status === 400) {
      this.error.set('Los datos enviados no son validos. Revisa los campos del formulario.');
    } else {
      this.error.set('No se pudo guardar el habito.');
    }
    this.loading.set(false);
  }

  protected mensajeValidacion(
    campo: 'categoriaId' | 'nombre' | 'descripcion' | 'puntajeBase' | 'activo',
  ): string {
    const control = this.form.controls[campo];

    if (!control.touched) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('maxlength')) {
      return `Maximo ${control.getError('maxlength').requiredLength} caracteres.`;
    }

    if (control.hasError('min')) {
      return campo === 'categoriaId'
        ? 'Selecciona una categoria de habito.'
        : 'El puntaje base debe ser mayor o igual a 0.01.';
    }

    return '';
  }
}
