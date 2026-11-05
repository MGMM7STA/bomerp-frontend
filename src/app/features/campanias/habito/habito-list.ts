import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CategoriaHabitoService } from '../categoria-habito/categoria-habito-service';
import { CategoriaHabito } from '../categoria-habito/categoria-habito.model';
import { HabitoService } from './habito-service';
import { Habito } from './habito.model';
import { MensajeError } from '../../../shared/mensaje-error/mensaje-error';
import { AuthService } from '../../../core/auth/auth-service';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion';

@Component({
  selector: 'app-habito-list',
  imports: [RouterLink, MensajeError, MatFormFieldModule, MatSelectModule],
  templateUrl: './habito-list.html',
})
export class HabitoList implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly habitoService = inject(HabitoService);
  private readonly categoriaHabitoService = inject(CategoriaHabitoService);

  protected readonly habitos = signal<Habito[]>([]);
  protected readonly categorias = signal<CategoriaHabito[]>([]);
  protected readonly categoriaFiltro = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.categoriaHabitoService.listar().subscribe({
      next: (data) => this.categorias.set(data),
      error: () => this.error.set('No se pudo cargar la lista de categorías de hábito.'),
    });
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.habitoService.listar(this.categoriaFiltro() ?? undefined).subscribe({
      next: (data) => this.habitos.set(data),
      error: () => {
        this.error.set('No se pudo cargar la lista de hábitos.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  filtrar(categoriaId: number): void {
    this.categoriaFiltro.set(categoriaId || null);
    this.cargar();
  }

  eliminar(id: number, nombre: string): void {
    this.confirmacion
      .preguntar({
        titulo: 'Eliminar hábito',
        mensaje: `Se eliminará "${nombre}". Si tiene registros o está en una campaña no se podrá borrar.`,
        aceptar: 'Eliminar',
        peligro: true,
      })
      .subscribe((si) => {
        if (si) this.borrar(id);
      });
  }

  private borrar(id: number): void {
    this.habitoService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.error.set(err.error?.message ?? 'El hábito tiene registros asociados.');
        } else if (err.status === 404) {
          this.error.set('El hábito ya no existe. Se recargó la lista.');
          this.cargar();
        } else {
          this.error.set('No se pudo eliminar el hábito.');
        }
      },
    });
  }
}
