import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sin-permiso',
  imports: [RouterLink],
  template: `
    <section class="ss-tarjeta caja">
      <span class="icono"><span class="material-symbols-outlined">lock</span></span>
      <h1>Esta pantalla no es para tu rol</h1>
      <p>Tu cuenta no tiene permiso para entrar aquí. Si crees que es un error, pídele a coordinación que revise tu rol.</p>
      <a class="ss-btn ss-btn-primario" routerLink="/">
        <span class="material-symbols-outlined">home</span>
        Volver al inicio
      </a>
    </section>
  `,
  styles: `
    .caja {
      max-width: 460px;
      margin: 3rem auto;
      padding: 2.25rem 1.5rem;
      text-align: center;
    }
    .icono {
      display: inline-grid;
      place-items: center;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 14px;
      background: var(--ss-orange-soft);
      color: var(--ss-orange-ink);
    }
    .icono .material-symbols-outlined {
      font-size: 1.75rem;
    }
    h1 {
      margin: 1rem 0 0.4rem;
      font-size: 1.25rem;
      color: var(--ss-navy);
    }
    p {
      margin: 0 0 1.25rem;
      line-height: 1.5;
      color: var(--ss-muted);
    }
  `,
})
export class SinPermiso {}
