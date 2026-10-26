
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CategoriaPremioService } from './categoria-premio-service';
import { AuthService } from '../../../core/auth/auth-service';
import { CategoriaPremio, CategoriaPremioRequest } from './categoria-premio.model';

@Component({
  selector: 'app-categorias-premio',
  imports: [FormsModule],
  templateUrl: './categoria-premio-list.html',
  styleUrl: './categoria-premio-list.css',
})
export class CategoriaPremioList implements OnInit {
  private readonly service = inject(CategoriaPremioService);
  protected readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  categorias: CategoriaPremio[] = [];
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  formularioAbierto = false;
  editandoId: number | null = null;

  nombre = '';
  descripcion = '';

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.service.listar().subscribe({
      next: (datos) => {
        this.categorias = datos;
        this.cargando = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);

        this.cargando = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudieron cargar las categorías. Código: ${err.status}.`;

        this.cdr.detectChanges();
      }
    });
  }

  abrirNuevo(): void {
    this.limpiarFormulario();
    this.formularioAbierto = true;
  }

  editar(categoria: CategoriaPremio): void {
    this.editandoId = categoria.id;
    this.nombre = categoria.nombre;
    this.descripcion = categoria.descripcion ?? '';
    this.mensaje = '';
    this.error = '';
    this.formularioAbierto = true;
  }

  guardar(): void {
    const nombre = this.nombre.trim();

    if (!nombre) {
      this.error = 'Escribe el nombre de la categoría.';
      return;
    }

    const request: CategoriaPremioRequest = {
      nombre,
      descripcion: this.descripcion.trim() || null
    };

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    const peticion = this.editandoId === null
      ? this.service.crear(request)
      : this.service.actualizar(this.editandoId, request);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.formularioAbierto = false;
        this.limpiarFormulario();
        this.mensaje = 'La categoría se guardó correctamente.';
        this.cdr.detectChanges();
        this.listar();
      },
      error: (err) => {
        console.error('Error al guardar categoría:', err);

        this.guardando = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudo guardar la categoría. Código: ${err.status}.`;

        this.cdr.detectChanges();
      }
    });
  }

  eliminar(categoria: CategoriaPremio): void {
    const confirmado = confirm(
      `¿Deseas eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmado) return;

    this.error = '';
    this.mensaje = '';

    this.service.eliminar(categoria.id).subscribe({
      next: () => {
        this.mensaje = 'La categoría se eliminó correctamente.';
        this.cdr.detectChanges();
        this.listar();
      },
      error: (err) => {
        console.error('Error al eliminar categoría:', err);

        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudo eliminar. Código: ${err.status}. Comprueba si tiene premios asociados.`;

        this.cdr.detectChanges();
      }
    });
  }

  cancelar(): void {
    this.formularioAbierto = false;
    this.limpiarFormulario();
  }

  private limpiarFormulario(): void {
    this.editandoId = null;
    this.nombre = '';
    this.descripcion = '';
    this.error = '';
  }
}
