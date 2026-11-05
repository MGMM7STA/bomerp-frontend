import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RegistroService } from '../registro/registro-service';
import { RegistroResponse } from '../registro/registro.model';
import { EstudianteService } from '../estudiante/estudiante-service';
import { Estudiante } from '../estudiante/estudiante.model';
import { mensajeDeError } from '../../../shared/utilidades/errores';

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

@Component({
  selector: 'app-validacion',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './validacion.html',
  styleUrl: './validacion.css',
})
export class Validacion implements OnInit {
  private readonly registroService = inject(RegistroService);
  private readonly estudianteService = inject(EstudianteService);

  protected readonly pendientes = signal<RegistroResponse[]>([]);
  protected readonly estudiantes = signal<Map<number, Estudiante>>(new Map());
  protected readonly cargando = signal(true);
  protected readonly ocupado = signal<number | null>(null);
  protected readonly rechazando = signal<number | null>(null);
  protected readonly motivo = signal('');
  protected readonly aviso = signal<Aviso | null>(null);
  protected readonly revisadosHoy = signal(0);

  protected readonly evidencias = computed(() =>
    this.pendientes().reduce((suma, r) => suma + r.totalEvidencias, 0),
  );

  protected readonly conFoto = computed(
    () => this.pendientes().filter((r) => r.detalles.some((d) => !!d.urlImagen)).length,
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

  protected validar(registro: RegistroResponse): void {
    this.ocupado.set(registro.id);
    this.registroService.validar(registro.id).subscribe({
      next: () => this.terminar(registro, `Validaste el registro de ${this.nombre(registro)}.`),
      error: (err) => this.fallar(err),
    });
  }

  protected abrirRechazo(registro: RegistroResponse): void {
    this.rechazando.set(registro.id);
    this.motivo.set('');
  }

  protected cancelarRechazo(): void {
    this.rechazando.set(null);
    this.motivo.set('');
  }

  protected escribirMotivo(evento: Event): void {
    this.motivo.set((evento.target as HTMLTextAreaElement).value);
  }

  protected rechazar(registro: RegistroResponse): void {
    const motivo = this.motivo().trim();
    if (motivo.length < 5) return;
    this.ocupado.set(registro.id);
    this.registroService.rechazar(registro.id, motivo).subscribe({
      next: () => {
        this.rechazando.set(null);
        this.terminar(registro, `Rechazaste el registro de ${this.nombre(registro)}. Su cupo del día quedó libre.`);
      },
      error: (err) => this.fallar(err),
    });
  }

  private terminar(registro: RegistroResponse, texto: string): void {
    this.pendientes.update((lista) => lista.filter((r) => r.id !== registro.id));
    this.revisadosHoy.update((n) => n + 1);
    this.ocupado.set(null);
    this.aviso.set({ tipo: 'ok', texto });
  }

  private fallar(err: unknown): void {
    this.ocupado.set(null);
    this.aviso.set({ tipo: 'error', texto: mensajeDeError(err, 'No se pudo guardar la revisión.') });
    this.cargar();
  }
}
