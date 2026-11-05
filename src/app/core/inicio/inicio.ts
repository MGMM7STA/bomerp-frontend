import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth-service';
import { InicioEstudiante } from './inicio-estudiante';
import { PanelCoordinacion } from './panel-coordinacion';

@Component({
  imports: [PanelCoordinacion, InicioEstudiante],
  selector: 'app-inicio',
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio {
  protected readonly auth = inject(AuthService);

  protected readonly esCoordinacion = computed(() => this.auth.tieneRol('COORDINADOR', 'ADMIN'));
}
