import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RegistroService } from '../registro/registro-service';
import { DetalleEvidenciaResponse, RegistroResponse } from '../registro/registro.model';
import { SedeService } from '../../../core/sede/sede-service';
import { EstudianteService } from '../estudiante/estudiante-service';
import { Estudiante } from '../estudiante/estudiante.model';
import { mensajeDeError } from '../../../shared/utilidades/errores';
import { estiloEstado } from '../../../shared/utilidades/estados';
import { FotoEvidencia } from '../../../shared/foto-evidencia/foto-evidencia';

interface Rechazo {
  registroId: number;
  detalleId: number | null;
}

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

@Component({
  selector: 'app-validacion',
  imports: [DatePipe, DecimalPipe, NgTemplateOutlet, FotoEvidencia],
  templateUrl: './validacion.html',
  styleUrl: './validacion.css',
})
export class Validacion implements OnInit {
  private readonly registroService = inject(RegistroService);
  private readonly estudianteService = inject(EstudianteService);
  protected readonly sede = inject(SedeService);

  protected readonly pendientes = signal<RegistroResponse[]>([]);
  protected readonly estudiantes = signal<Map<number, Estudiante>>(new Map());
  protected readonly cargando = signal(true);
  protected readonly ocupado = signal<number | null>(null);
  protected readonly rechazando = signal<Rechazo | null>(null);
  protected readonly estilo = estiloEstado;
  protected readonly motivo = signal('');
  protected readonly aviso = signal<Aviso | null>(null);
  protected readonly revisadosHoy = signal(0);

  protected readonly evidencias = computed(
    () => this.pendientes().flatMap((r) => r.detalles).filter((d) => d.estado === 'ENVIADO').length,
  );

  protected readonly conFoto = computed(
    () =>
      this.pendientes()
        .flatMap((r) => r.detalles)
        .filter((d) => d.estado === 'ENVIADO' && (d.tieneFoto || !!d.urlImagen)).length,
  );

  ngOnInit(): void {
    this.estudianteService.listar().subscribe({
      next: (data) => this.estudiantes.set(new Map(data.map((e) => [e.id, e]))),
    });
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.registroService.buscar('ENVIADO', undefined, undefined, undefined, 'fecha', 'ASC').subscribe({
      next: (data) => {
        this.pendientes.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.aviso.set({ tipo: 'error', texto: mensajeDeError(err, 'No se pudieron cargar los pendientes.') });
        this.cargando.set(false);
      },
    });
  }

  protected nombre(registro: RegistroResponse): string {
    return this.estudiantes().get(registro.estudianteId)?.nombre ?? `Estudiante #${registro.estudianteId}`;
  }

  protected correo(registro: RegistroResponse): string {
    return this.estudiantes().get(registro.estudianteId)?.correo ?? '';
  }

  protected iniciales(registro: RegistroResponse): string {
    return this.nombre(registro)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('');
  }

  protected pendientesDe(registro: RegistroResponse): number {
    return registro.detalles.filter((d) => d.estado === 'ENVIADO').length;
  }

  protected rechazandoEste(registro: RegistroResponse, detalle: DetalleEvidenciaResponse | null): boolean {
    const actual = this.rechazando();
    return actual?.registroId === registro.id && actual.detalleId === (detalle?.id ?? null);
  }

  protected validarTodo(registro: RegistroResponse): void {
    this.ocupado.set(registro.id);
    this.registroService.validar(registro.id).subscribe({
      next: (r) => this.actualizar(r, `Validaste todo lo pendiente de ${this.nombre(registro)}.`),
      error: (err) => this.fallar(err),
    });
  }

  protected validarDetalle(registro: RegistroResponse, detalle: DetalleEvidenciaResponse): void {
    this.ocupado.set(registro.id);
    this.registroService.validarDetalle(registro.id, detalle.id).subscribe({
      next: (r) => this.actualizar(r, `Validaste "${detalle.nombreHabito}" de ${this.nombre(registro)}.`),
      error: (err) => this.fallar(err),
    });
  }

  protected abrirRechazo(registro: RegistroResponse, detalle: DetalleEvidenciaResponse | null): void {
    this.rechazando.set({ registroId: registro.id, detalleId: detalle?.id ?? null });
    this.motivo.set('');
  }

  protected cancelarRechazo(): void {
    this.rechazando.set(null);
    this.motivo.set('');
  }

  protected escribirMotivo(evento: Event): void {
    this.motivo.set((evento.target as HTMLTextAreaElement).value);
  }

  protected confirmarRechazo(registro: RegistroResponse): void {
    const motivo = this.motivo().trim();
    const actual = this.rechazando();
    if (motivo.length < 5 || !actual) return;
    this.ocupado.set(registro.id);
    const detalle = registro.detalles.find((d) => d.id === actual.detalleId);
    const peticion = detalle
      ? this.registroService.rechazarDetalle(registro.id, detalle.id, motivo)
      : this.registroService.rechazar(registro.id, motivo);
    peticion.subscribe({
      next: (r) => {
        this.rechazando.set(null);
        this.actualizar(
          r,
          detalle
            ? `Rechazaste "${detalle.nombreHabito}" de ${this.nombre(registro)}. Su cupo quedó libre.`
            : `Rechazaste lo pendiente de ${this.nombre(registro)}. Su cupo quedó libre.`,
        );
      },
      error: (err) => this.fallar(err),
    });
  }

  private actualizar(actualizado: RegistroResponse, texto: string): void {
    if (actualizado.estado === 'ENVIADO') {
      this.pendientes.update((lista) => lista.map((r) => (r.id === actualizado.id ? actualizado : r)));
    } else {
      this.pendientes.update((lista) => lista.filter((r) => r.id !== actualizado.id));
      this.revisadosHoy.update((n) => n + 1);
    }
    this.ocupado.set(null);
    this.aviso.set({ tipo: 'ok', texto });
  }

  private fallar(err: unknown): void {
    this.ocupado.set(null);
    this.aviso.set({ tipo: 'error', texto: mensajeDeError(err, 'No se pudo guardar la revisión.') });
    this.cargar();
  }
}
