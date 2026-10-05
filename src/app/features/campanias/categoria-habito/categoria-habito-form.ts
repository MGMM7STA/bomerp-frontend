import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaHabitoService } from './categoria-habito-service';
import { MensajeError } from '../../../shared/mensaje-error/mensaje-error';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-categoria-habito-form',
  imports: [ReactiveFormsModule, MensajeError, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './categoria-habito-form.html',
})
export class CategoriaHabitoForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriaHabitoService = inject(CategoriaHabitoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly id = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly errorCarga = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', [Validators.maxLength(255)]],
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.id.set(id);
      this.loading.set(true);
      this.categoriaHabitoService.obtener(id).subscribe({
        next: (categoria) => {
          this.form.patchValue(categoria);
          this.loading.set(false);
        },
        error: () => {
          this.errorCarga.set(true);
          this.error.set('No se pudo cargar la categoria de habito.');
          this.loading.set(false);
        },
      });
    }
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe((valor) => {
      console.log('Formulario:', valor);
      console.log('Nombre:', valor.nombre);
      console.log('Descripcion:', valor.descripcion);
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
      ? this.categoriaHabitoService.actualizar(id, valor)
      : this.categoriaHabitoService.crear(valor);

    this.loading.set(true);
    peticion.subscribe({
      next: () => this.router.navigate(['/campanias/categorias-habito']),
      error: (err: HttpErrorResponse) => {
        if (err.status === 400) {
          this.error.set('El backend rechazo los datos enviados. Revise el nombre y la descripcion.');
        } else if (err.status === 404) {
          this.error.set('La categoria de habito ya no existe.');
        } else {
          this.error.set('No se pudo guardar la categoria de habito.');
        }
        this.loading.set(false);
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/campanias/categorias-habito']);
  }

  protected mensajeValidacion(campo: 'nombre' | 'descripcion'): string {
    const control = this.form.controls[campo];

    if (!control.touched) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('maxlength')) {
      return `Maximo ${control.getError('maxlength').requiredLength} caracteres.`;
    }

    return '';
  }
}
