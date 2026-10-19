import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sin-permiso',
  imports: [RouterLink],
  template: `
    <p>No tienes permiso para acceder a esa pantalla.</p>
    <a routerLink="/">Volver al inicio</a>
  `,
})
export class SinPermiso {}