import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CategoriaHabitoService } from './categoria-habito-service';
import { CategoriaHabito } from './categoria-habito.model';
import { MensajeError } from '../../../shared/mensaje-error/mensaje-error';

@Component({
  selector: 'app-categoria-habito-list',
  imports: [RouterLink, MensajeError],
  templateUrl: './categoria-habito-list.html',
})
export class CategoriaHabitoList implements OnInit {
  private readonly categoriaHabitoService = inject(CategoriaHabitoService);

  protected readonly categorias = signal<CategoriaHabito[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.categoriaHabitoService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: () => {
        this.error.set('No se pudo cargar la lista de categorias de habito.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  eliminar(id: number, nombre: string): void {
    if (!confirm(`Esta seguro de eliminar la categoria "${nombre}"?`)) {
      return;
    }

    this.categoriaHabitoService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.error.set(err.error?.message ?? 'La categoria tiene habitos asociados.');
        } else if (err.status === 404) {
          this.error.set('La categoria ya no existe. Se recargo la lista.');
          this.cargar();
        } else {
          this.error.set('No se pudo eliminar la categoria de habito.');
        }
      },
    });
  }
}
