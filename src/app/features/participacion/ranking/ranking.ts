import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { SedeService } from '../../../core/sede/sede-service';
import { mensajeDeError } from '../../../shared/utilidades/errores';
import { EstudianteService } from '../estudiante/estudiante-service';
import { FilaRanking, Ranking as DatosRanking } from '../estudiante/estudiante.model';

@Component({
  selector: 'app-ranking',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './ranking.html',
  styleUrl: './ranking.css',
})
export class Ranking implements OnInit {
  private readonly estudianteService = inject(EstudianteService);
  private readonly auth = inject(AuthService);
  protected readonly sede = inject(SedeService);

  protected readonly datos = signal<DatosRanking | null>(null);
  protected readonly cargando = signal(true);
  protected readonly sinCampania = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly esEstudiante = computed(() => this.auth.tieneRol('ESTUDIANTE'));
  protected readonly esCoordinacion = computed(() => this.auth.tieneRol('COORDINADOR', 'ADMIN'));

  protected readonly podio = computed<FilaRanking[]>(() => (this.datos()?.filas ?? []).slice(0, 3));
  protected readonly resto = computed<FilaRanking[]>(() => (this.datos()?.filas ?? []).slice(3));

  protected readonly ordenPodio = computed(() => {
    const [primero, segundo, tercero] = this.podio();
    return [segundo, primero, tercero].filter((fila): fila is FilaRanking => !!fila);
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.sinCampania.set(false);
    this.estudianteService.ranking(50).subscribe({
      next: (data) => {
        this.datos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.sinCampania.set(true);
          return;
        }
        this.error.set(mensajeDeError(err, 'No se pudo cargar el ranking.'));
      },
    });
  }

  protected esMia(fila: FilaRanking): boolean {
    return this.datos()?.mia?.estudianteId === fila.estudianteId;
  }

  protected medalla(posicion: number): string {
    return posicion === 1 ? 'oro' : posicion === 2 ? 'plata' : 'bronce';
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('');
  }
}
