import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CategoriaService } from '../categoria/categoria-service';
import { Categoria } from '../categoria/categoria.model';
import { ProductoService } from './producto-service';
import { Producto } from './producto.model';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-producto-list',
    imports: [RouterLink, CurrencyPipe, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './producto-list.html',
})
export class ProductoList implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaFiltro = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: () => this.error.set('No se pudo cargar la lista de categorías.'),
    });
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productoService.listar(this.categoriaFiltro() ?? undefined).subscribe({
      next: (data) => this.productos.set(data),
      error: () => {
        this.error.set('No se pudo cargar la lista de productos.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  filtrar(categoriaId: number): void {
    this.categoriaFiltro.set(categoriaId || null);
    this.cargar();
  }

  eliminar(id: number): void {
    if (!confirm(`¿Está seguro de eliminar el producto ${id}?`)) {
      return;
    }

    this.productoService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.error.set('El producto ya no existe. Se recargó la lista.');
          this.cargar();
        } else {
          this.error.set('No se pudo eliminar el producto.');
        }
      },
    });
  }
}