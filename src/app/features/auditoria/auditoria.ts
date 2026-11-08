import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { nombreSede } from '../../core/sede/sede-service';
import { mensajeDeError } from '../../shared/utilidades/errores';
import { AuditoriaService } from './auditoria-service';
import { EventoAuditoria } from './auditoria.model';

const ACCIONES: Record<string, { texto: string; clase: string; icono: string }> = {
  REGISTRAR_PARTICIPACION: { texto: 'Registró participación', clase: 'ss-badge-info', icono: 'add_task' },
  VALIDAR_EVIDENCIA: { texto: 'Validó evidencia', clase: 'ss-badge-ok', icono: 'task_alt' },
  RECHAZAR_EVIDENCIA: { texto: 'Rechazó evidencia', clase: 'ss-badge-rechazado', icono: 'cancel' },
  VALIDAR_REGISTRO: { texto: 'Validó registro', clase: 'ss-badge-ok', icono: 'verified' },
  RECHAZAR_REGISTRO: { texto: 'Rechazó registro', clase: 'ss-badge-rechazado', icono: 'block' },
  ANULAR_REGISTRO: { texto: 'Anuló registro', clase: 'ss-badge-rechazado', icono: 'undo' },
  EMITIR_ACTA: { texto: 'Emitió acta', clase: 'ss-badge-ok', icono: 'workspace_premium' },
  ANULAR_ACTA: { texto: 'Anuló acta', clase: 'ss-badge-rechazado', icono: 'block' },
  CREAR_CUENTA: { texto: 'Creó cuenta', clase: 'ss-badge-info', icono: 'person_add' },
  CAMBIAR_ROL: { texto: 'Cambió rol', clase: 'ss-badge-pendiente', icono: 'badge' },
  ACTIVAR_CUENTA: { texto: 'Activó cuenta', clase: 'ss-badge-ok', icono: 'lock_open' },
  DESACTIVAR_CUENTA: { texto: 'Desactivó cuenta', clase: 'ss-badge-rechazado', icono: 'lock' },
  RESTABLECER_CONTRASENIA: { texto: 'Restableció contraseña', clase: 'ss-badge-pendiente', icono: 'key' },
  CREAR_CAMPANIA: { texto: 'Creó campaña', clase: 'ss-badge-info', icono: 'campaign' },
  EDITAR_CAMPANIA: { texto: 'Editó campaña', clase: 'ss-badge-pendiente', icono: 'edit' },
  ELIMINAR_CAMPANIA: { texto: 'Eliminó campaña', clase: 'ss-badge-rechazado', icono: 'delete' },
  CREAR_HABITO: { texto: 'Creó hábito', clase: 'ss-badge-info', icono: 'self_improvement' },
  EDITAR_HABITO: { texto: 'Editó hábito', clase: 'ss-badge-pendiente', icono: 'edit' },
  ELIMINAR_HABITO: { texto: 'Eliminó hábito', clase: 'ss-badge-rechazado', icono: 'delete' },
  CREAR_CATEGORIA_HABITO: { texto: 'Creó categoría de hábito', clase: 'ss-badge-info', icono: 'sell' },
  EDITAR_CATEGORIA_HABITO: { texto: 'Editó categoría de hábito', clase: 'ss-badge-pendiente', icono: 'edit' },
  ELIMINAR_CATEGORIA_HABITO: { texto: 'Eliminó categoría de hábito', clase: 'ss-badge-rechazado', icono: 'delete' },
  CREAR_PREMIO: { texto: 'Creó premio', clase: 'ss-badge-info', icono: 'redeem' },
  EDITAR_PREMIO: { texto: 'Editó premio', clase: 'ss-badge-pendiente', icono: 'edit' },
  ELIMINAR_PREMIO: { texto: 'Eliminó premio', clase: 'ss-badge-rechazado', icono: 'delete' },
  CREAR_CATEGORIA_PREMIO: { texto: 'Creó categoría de premio', clase: 'ss-badge-info', icono: 'category' },
  EDITAR_CATEGORIA_PREMIO: { texto: 'Editó categoría de premio', clase: 'ss-badge-pendiente', icono: 'edit' },
  ELIMINAR_CATEGORIA_PREMIO: { texto: 'Eliminó categoría de premio', clase: 'ss-badge-rechazado', icono: 'delete' },
};

@Component({
  selector: 'app-auditoria',
  imports: [DatePipe, MatSelectModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
})
export class Auditoria implements OnInit {
  private readonly service = inject(AuditoriaService);

  protected readonly eventos = signal<EventoAuditoria[]>([]);
  protected readonly acciones = signal<string[]>([]);
  protected readonly accion = signal('');
  protected readonly usuario = signal('');
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(20);
  protected readonly totalElementos = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly nombreSede = nombreSede;

  protected readonly desdeFila = computed(() =>
    this.totalElementos() === 0 ? 0 : this.pagina() * this.tamanio() + 1,
  );
  protected readonly hastaFila = computed(() =>
    Math.min((this.pagina() + 1) * this.tamanio(), this.totalElementos()),
  );

  ngOnInit(): void {
    this.service.acciones().subscribe({ next: (data) => this.acciones.set(data) });
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.service.buscar(this.accion(), this.usuario(), this.pagina(), this.tamanio()).subscribe({
      next: (data) => {
        this.eventos.set(data.contenido);
        this.totalElementos.set(data.totalElementos);
        this.totalPaginas.set(data.totalPaginas);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudo cargar la auditoría.'));
        this.cargando.set(false);
      },
    });
  }

  protected filtrarAccion(accion: string): void {
    this.accion.set(accion ?? '');
    this.pagina.set(0);
    this.cargar();
  }

  protected buscarUsuario(evento: Event): void {
    this.usuario.set((evento.target as HTMLInputElement).value);
    this.pagina.set(0);
    this.cargar();
  }

  protected irA(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas()) return;
    this.pagina.set(pagina);
    this.cargar();
  }

  protected info(accion: string) {
    return ACCIONES[accion] ?? { texto: accion, clase: 'ss-badge-gris', icono: 'history' };
  }
}
