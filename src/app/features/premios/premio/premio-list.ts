
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PremioService } from './premio-service';
import { AuthService } from '../../../core/auth/auth-service';
import { CategoriaPremioService } from '../categoria-premio/categoria-premio-service';

import { Premio, PremioRequest } from './premio.model';
import { CategoriaPremio } from '../categoria-premio/categoria-premio.model';

@Component({
  selector: 'app-premios',
  imports: [FormsModule],
  templateUrl: './premio-list.html',
  styleUrl: './premio-list.css',
})
export class PremioList implements OnInit {
  private readonly premioService = inject(PremioService);
  protected readonly auth = inject(AuthService);
  private readonly categoriaService = inject(CategoriaPremioService);
  private readonly cdr = inject(ChangeDetectorRef);

  premios: Premio[] = [];
  categorias: CategoriaPremio[] = [];

  cargando = false;
  guardando = false;
  formularioAbierto = false;

  error = '';
  mensaje = '';
  editandoId: number | null = null;

  nombre = '';
  descripcion = '';
  stock = 0;
  activo = true;
  categoriaId: number | null = null;
  filtroCategoriaId: number | null = null;

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargarCategorias();
    this.listar();
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (datos) => {
        this.categorias = datos;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.error = 'No se pudieron cargar las categorías. Comprueba el backend.';
        this.cdr.detectChanges();
      }
    });
  }

  listar(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    const peticion = this.filtroCategoriaId === null
      ? this.premioService.listar()
      : this.premioService.listar(this.filtroCategoriaId);

    peticion.subscribe({
      next: (datos) => {
        this.premios = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al listar premios:', err);
        this.premios = [];
        this.cargando = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudieron cargar los premios. Código: ${err.status}.`;
        this.cdr.detectChanges();
      }
    });
  }

  abrirNuevo(): void {
    this.limpiarFormulario();
    this.formularioAbierto = true;
  }

  editar(premio: Premio): void {
    this.editandoId = premio.id;
    this.nombre = premio.nombre;
    this.descripcion = premio.descripcion ?? '';
    this.stock = premio.stock;
    this.activo = premio.activo;
    this.categoriaId = premio.categoria.id;
    this.error = '';
    this.mensaje = '';
    this.formularioAbierto = true;
  }

  guardar(): void {
    const nombre = this.nombre.trim();

    if (!nombre) {
      this.error = 'Escribe el nombre del premio.';
      return;
    }

    if (!Number.isInteger(this.stock) || this.stock < 0) {
      this.error = 'El stock debe ser un número entero igual o mayor que cero.';
      return;
    }

    if (this.categoriaId === null) {
      this.error = 'Selecciona una categoría para el premio.';
      return;
    }

    const request: PremioRequest = {
      nombre,
      descripcion: this.descripcion.trim() || null,
      stock: this.stock,
      activo: this.activo,
      categoriaId: this.categoriaId
    };

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    const peticion = this.editandoId === null
      ? this.premioService.crear(request)
      : this.premioService.actualizar(this.editandoId, request);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.formularioAbierto = false;
        this.limpiarFormulario();
        this.mensaje = 'El premio se guardó correctamente.';
        this.cdr.detectChanges();
        this.listar();
      },
      error: (err) => {
        console.error('Error al guardar premio:', err);
        this.guardando = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudo guardar el premio. Código: ${err.status}.`;
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(premio: Premio): void {
    const confirmado = confirm(
      `¿Deseas eliminar el premio "${premio.nombre}"?`
    );

    if (!confirmado) return;

    this.error = '';
    this.mensaje = '';

    this.premioService.eliminar(premio.id).subscribe({
      next: () => {
        this.mensaje = 'El premio se eliminó correctamente.';
        this.cdr.detectChanges();
        this.listar();
      },
      error: (err) => {
        console.error('Error al eliminar premio:', err);
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudo eliminar el premio. Código: ${err.status}.`;
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
    this.stock = 0;
    this.activo = true;
    this.categoriaId = null;
    this.error = '';
  }
}
