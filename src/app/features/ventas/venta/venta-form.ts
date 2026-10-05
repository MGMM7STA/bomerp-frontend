import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../../catalogo/producto/producto-service';
import { Producto } from '../../catalogo/producto/producto.model';
import { VentaService } from './venta-service';

@Component({
  selector: 'app-venta-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './venta-form.html',
})
export class VentaForm {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly ventaService = inject(VentaService);
  private readonly router = inject(Router);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    detalles: this.fb.array([this.crearLinea()], [Validators.minLength(1)]),
  });

  protected readonly valoresDetalles = toSignal(
    this.form.controls.detalles.valueChanges,
    { initialValue: this.form.controls.detalles.getRawValue() },
  );

  protected readonly subtotales = computed(() =>
    this.valoresDetalles().map((linea) => {
      const producto = this.productos().find((p) => p.id === linea.productoId);
      return (producto?.precio ?? 0) * (linea.cantidad ?? 0);
    }),
  );

  protected readonly total = computed(() => this.subtotales().reduce((suma, s) => suma + s, 0));

  constructor() {
    this.productoService.listar().subscribe({
      next: (data) => this.productos.set(data),
      error: () => this.error.set('No se pudieron cargar los productos.'),
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

  protected confirmarYGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa las lineas: cada una necesita un producto elegido y una cantidad de al menos 1.');
      return;
    }
    this.error.set(null);
    const cantidadLineas = this.lineasForm.length;
    const resumen = `Vas a registrar una venta de ${cantidadLineas} línea(s) por un total de ` +
      `S/ ${this.total().toFixed(2)}. ¿Confirmar?`;
    if (!confirm(resumen)) return;
    this.guardar();
  }

  private guardar(): void {
    this.error.set(null);
    this.loading.set(true);
    this.ventaService.crear(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/ventas/reporte']),
      error: (err: HttpErrorResponse) => this.manejarErrorGuardado(err),
    });
  }

  private manejarErrorGuardado(err: HttpErrorResponse): void {
    const mensaje: string = err.error?.message ?? '';

    if (err.status === 404 && mensaje.startsWith('Producto no encontrado')) {
      this.error.set('Uno de los productos elegidos ya no existe. Revisa las líneas de la venta.');
    } else if (err.status === 409) {
      this.error.set(mensaje || 'No hay stock suficiente para completar la venta.');
    } else if (err.status === 400) {
      this.error.set('Los datos enviados no son válidos. Revisa las líneas de la venta.');
    } else {
      this.error.set('No se pudo registrar la venta.');
    }
    this.loading.set(false);
  }

  protected get lineasForm() {
    return this.form.controls.detalles;
  }

  private crearLinea() {
    return this.fb.nonNullable.group({
      productoId: [0, [Validators.min(1)]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
    });
  }
}