import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CategoriaService } from '../categoria/categoria-service';
import { Categoria } from '../categoria/categoria.model';
import { ProductoService } from './producto-service';

function entero(control: AbstractControl): ValidationErrors | null {
  return Number.isInteger(control.value) ? null : { entero: true };
}

@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './producto-form.html',
})
export class ProductoForm {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly id = signal<number | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriasCargadas = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorCarga = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0), entero]],
    categoriaId: [0, [Validators.min(1)]],
  });

  constructor() {
    this.cargarCategorias();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.id.set(id);
      this.loading.set(true);
      this.productoService.obtener(id).subscribe({
        next: (producto) => {
          this.form.patchValue({
            nombre: producto.nombre,
            precio: producto.precio,
            stock: producto.stock,
            categoriaId: producto.categoria.id,
          });
          this.loading.set(false);
        },
        error: () => {
          this.errorCarga.set(true);
          this.error.set('No se pudo cargar el producto.');
          this.loading.set(false);
        },
      });
    }
  }

  private cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.categoriasCargadas.set(true);
      },
      error: () => this.error.set('No se pudieron cargar las categorías.'),
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
      ? this.productoService.actualizar(id, valor)
      : this.productoService.crear(valor);

    this.loading.set(true);
    peticion.subscribe({
      next: () => this.router.navigate(['/catalogo/productos']),
      error: (err: HttpErrorResponse) => this.manejarErrorGuardado(err),
    });
  }

  cancelar(): void {
    this.router.navigate(['/catalogo/productos']);
  }

  private manejarErrorGuardado(err: HttpErrorResponse): void {
    const mensaje: string = err.error?.message ?? '';

    if (err.status === 404 && mensaje.startsWith('Categoria')) {
      this.error.set('La categoría seleccionada ya no existe. Elige otra de la lista.');
      this.form.controls.categoriaId.setValue(0);
      this.cargarCategorias();
    } else if (err.status === 400) {
      this.error.set('Los datos enviados no son válidos. Revisa los campos del formulario.');
    } else {
      this.error.set('No se pudo guardar el producto.');
    }
    this.loading.set(false);
  }

  protected mensajeValidacion(campo: 'nombre' | 'precio' | 'stock' | 'categoriaId'): string {
    const control = this.form.controls[campo];

    if (!control.touched) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('maxlength')) {
      return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    }

    if (control.hasError('min')) {
      return campo === 'categoriaId' ? 'Selecciona una categoría.' : 'Debe ser mayor o igual a 0.';
    }

    if (control.hasError('entero')) {
      return 'Debe ser un número entero.';
    }

    return '';
  }
}