
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ActaPremiacion, ActaPremiacionRequest } from './acta-premiacion.model';
import { DetallePremiacionRequest } from './detalle-premiacion.model';
import { ActaPremiacionService } from './acta-premiacion-service';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-actas-premiacion',
  imports: [FormsModule],
  templateUrl: './acta-premiacion-list.html',
  styleUrl: './acta-premiacion-list.css'
})
export class ActaPremiacionList implements OnInit {
  private readonly service = inject(ActaPremiacionService);
  protected readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  actas: ActaPremiacion[] = [];
  actaSeleccionada: ActaPremiacion | null = null;

  cargando = false;
  guardando = false;
  formularioAbierto = false;

  error = '';
  mensaje = '';

  campaniaId: number | null = null;
  fechaInicioPeriodo = '';
  fechaFinPeriodo = '';

  detalles: DetallePremiacionRequest[] = [];
  nuevoDetalle: DetallePremiacionRequest = this.detalleVacio();

  ngOnInit(): void {
    this.listar();
  }

  listar(): void {
    this.cargando = true;
    this.error = '';

    this.service.listar().subscribe({
      next: datos => {
        this.actas = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error al listar actas:', err);
        this.actas = [];
        this.cargando = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudieron cargar las actas. Código: ${err.status}.`;
        this.cdr.detectChanges();
      }
    });
  }

  abrirFormulario(): void {
    this.limpiarFormulario();
    this.formularioAbierto = true;
  }

  agregarDetalle(): void {
    const d = this.nuevoDetalle;

    if (
      !Number.isInteger(d.estudianteId) || d.estudianteId <= 0 ||
      !Number.isInteger(d.premioId) || d.premioId <= 0 ||
      !Number.isInteger(d.posicion) || d.posicion <= 0 ||
      !Number.isInteger(d.cantidad) || d.cantidad <= 0 ||
      !Number.isFinite(d.puntajeAlcanzado) || d.puntajeAlcanzado < 0
    ) {
      this.error = 'Completa correctamente todos los campos del detalle.';
      return;
    }

    this.detalles = [...this.detalles, { ...d }];
    this.nuevoDetalle = this.detalleVacio();
    this.error = '';
  }

  quitarDetalle(indice: number): void {
    this.detalles = this.detalles.filter((_, i) => i !== indice);
  }

  emitir(): void {
    if (!this.campaniaId || !Number.isInteger(this.campaniaId) ||
        this.campaniaId <= 0) {
      this.error = 'Ingresa un ID de campaña válido.';
      return;
    }

    if (!this.fechaInicioPeriodo || !this.fechaFinPeriodo) {
      this.error = 'Completa las fechas del período.';
      return;
    }

    if (this.fechaInicioPeriodo > this.fechaFinPeriodo) {
      this.error = 'La fecha de inicio no puede ser posterior a la fecha final.';
      return;
    }

    if (this.detalles.length === 0) {
      this.error = 'Agrega al menos un detalle de premiación.';
      return;
    }

    const request: ActaPremiacionRequest = {
      campaniaId: this.campaniaId,
      fechaInicioPeriodo: this.fechaInicioPeriodo,
      fechaFinPeriodo: this.fechaFinPeriodo,
      detalles: this.detalles.map(d => ({ ...d }))
    };

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    this.service.emitir(request).subscribe({
      next: () => {
        this.guardando = false;
        this.formularioAbierto = false;
        this.limpiarFormulario();
        this.mensaje = 'El acta se emitió correctamente.';
        this.cdr.detectChanges();
        this.listar();
      },
      error: err => {
        console.error('Error al emitir acta:', err);
        this.guardando = false;
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudo emitir el acta. Código: ${err.status}. Verifica los IDs y los datos enviados.`;
        this.cdr.detectChanges();
      }
    });
  }

  consultar(id: number): void {
    this.error = '';
    this.mensaje = '';

    this.service.obtener(id).subscribe({
      next: acta => {
        this.actaSeleccionada = acta;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error al consultar acta:', err);
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudo consultar el acta. Código: ${err.status}.`;
        this.cdr.detectChanges();
      }
    });
  }

  anular(acta: ActaPremiacion): void {
    if (acta.estado !== 'EMITIDA') {
      this.error = 'Solo se pueden anular actas emitidas.';
      return;
    }

    if (!confirm(`¿Deseas anular el acta N.º ${acta.id}?`)) {
      return;
    }

    this.error = '';
    this.mensaje = '';

    this.service.anular(acta.id).subscribe({
      next: () => {
        this.mensaje = `El acta N.º ${acta.id} se anuló correctamente.`;

        if (this.actaSeleccionada?.id === acta.id) {
          this.actaSeleccionada = null;
        }

        this.cdr.detectChanges();
        this.listar();
      },
      error: err => {
        console.error('Error al anular acta:', err);
        this.error = err.status === 0
          ? 'No se pudo conectar con el backend.'
          : `No se pudo anular el acta. Código: ${err.status}.`;
        this.cdr.detectChanges();
      }
    });
  }

  cancelar(): void {
    this.formularioAbierto = false;
    this.limpiarFormulario();
  }

  private detalleVacio(): DetallePremiacionRequest {
    return {
      estudianteId: 0,
      posicion: 1,
      premioId: 0,
      cantidad: 1,
      puntajeAlcanzado: 0
    };
  }

  private limpiarFormulario(): void {
    this.campaniaId = null;
    this.fechaInicioPeriodo = '';
    this.fechaFinPeriodo = '';
    this.detalles = [];
    this.nuevoDetalle = this.detalleVacio();
    this.error = '';
  }
}
