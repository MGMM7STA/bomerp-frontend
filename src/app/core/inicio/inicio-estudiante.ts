import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaniaService } from '../../features/campanias/campania/campania-service';
import { Campania } from '../../features/campanias/campania/campania.model';
import { Habito } from '../../features/campanias/habito/habito.model';
import { RegistroService } from '../../features/participacion/registro/registro-service';
import { RegistroResponse } from '../../features/participacion/registro/registro.model';
import { consumeCupo, estiloEstado } from '../../shared/utilidades/estados';
import { AuthService } from '../auth/auth-service';
import { claveDia, diasRestantes } from './fechas';

@Component({
  selector: 'app-inicio-estudiante',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './inicio-estudiante.html',
  styleUrl: './inicio-estudiante.css',
})
export class InicioEstudiante implements OnInit {
  private readonly campaniaService = inject(CampaniaService);
  private readonly registroService = inject(RegistroService);
  protected readonly auth = inject(AuthService);

  protected readonly campania = signal<Campania | null>(null);
  protected readonly habitos = signal<Habito[]>([]);
  protected readonly registros = signal<RegistroResponse[]>([]);
  protected readonly sinCampania = signal(false);
  protected readonly estilo = estiloEstado;

  protected readonly primerNombre = computed(
    () => this.auth.usuario()?.nombre.split(' ')[0] ?? '',
  );

  protected readonly quedan = computed(() => {
    const c = this.campania();
    return c ? diasRestantes(c.fechaFin) : 0;
  });

  protected readonly usadasHoy = computed(() => {
    const hoy = claveDia(new Date());
    return this.registros()
      .filter((r) => consumeCupo(r.estado) && r.fecha.slice(0, 10) === hoy)
      .reduce((suma, r) => suma + r.totalEvidencias, 0);
  });

  protected readonly maximo = computed(() => this.campania()?.maxEvidenciasDia ?? 0);

  protected readonly restantesHoy = computed(() => Math.max(0, this.maximo() - this.usadasHoy()));

  protected readonly avanceHoy = computed(() =>
    this.maximo() === 0 ? 0 : Math.min(100, (this.usadasHoy() / this.maximo()) * 100),
  );

  protected readonly puntosValidados = computed(() =>
    this.sumar(this.registros().filter((r) => r.estado === 'VALIDADO')),
  );

  protected readonly puntosPendientes = computed(() =>
    this.sumar(this.registros().filter((r) => r.estado === 'ENVIADO')),
  );

  protected readonly diasActivos = computed(
    () =>
      new Set(this.registros().filter((r) => consumeCupo(r.estado)).map((r) => r.fecha.slice(0, 10)))
        .size,
  );

  protected readonly recientes = computed(() => this.registros().slice(0, 3));

  ngOnInit(): void {
    this.campaniaService.obtenerActiva().subscribe({
      next: (data) => this.campania.set(data),
      error: () => this.sinCampania.set(true),
    });
    this.campaniaService.habitosDeActiva().subscribe({
      next: (data) => this.habitos.set(data),
    });
    this.registroService.buscar().subscribe({
      next: (data) => this.registros.set(data),
    });
  }

  private sumar(lista: RegistroResponse[]): number {
    return lista.reduce((suma, r) => suma + Number(r.puntajeTotal), 0);
  }
}
