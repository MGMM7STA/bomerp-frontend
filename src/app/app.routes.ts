import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { rolGuard } from './core/guards/rol-guard';

export const routes: Routes = [
  {
    path: 'auth/callback',
    loadComponent: () => import('./core/auth/auth-callback').then((m) => m.AuthCallback),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        loadComponent: () => import('./core/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'campanias/categorias-habito',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-list').then(
            (m) => m.CategoriaHabitoList,
          ),
      },
      {
        path: 'campanias/categorias-habito/nueva',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-form').then(
            (m) => m.CategoriaHabitoForm,
          ),
      },
      {
        path: 'campanias/categorias-habito/:id/editar',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-form').then(
            (m) => m.CategoriaHabitoForm,
          ),
      },
      {
        path: 'campanias/habitos',
        canActivate: [authGuard, rolGuard('COORDINADOR', 'ADMIN')],
        loadComponent: () =>
          import('./features/campanias/habito/habito-list').then((m) => m.HabitoList),
      },
      {
        path: 'campanias/habitos/nuevo',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/campanias/habito/habito-form').then((m) => m.HabitoForm),
      },
      {
        path: 'campanias/habitos/:id/editar',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/campanias/habito/habito-form').then((m) => m.HabitoForm),
      },
      {
        path: 'campanias',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/campanias/campania/campania-list').then((m) => m.CampaniaList),
      },
      {
        path: 'campanias/nueva',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/campanias/campania/campania-form').then((m) => m.CampaniaForm),
      },
      {
        path: 'campanias/:id/editar',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/campanias/campania/campania-form').then((m) => m.CampaniaForm),
      },
      {
        path: 'participacion/registrar',
        canActivate: [authGuard, rolGuard('ESTUDIANTE')],
        loadComponent: () =>
          import('./features/participacion/registro/registro-form').then((m) => m.RegistroForm),
      },
      {
        path: 'participacion/nuevo',
        redirectTo: 'participacion/registrar',
      },
      {
        path: 'participacion/mis-registros',
        canActivate: [authGuard, rolGuard('ESTUDIANTE')],
        loadComponent: () =>
          import('./features/participacion/mis-registros/mis-registros').then((m) => m.MisRegistros),
      },
      {
        path: 'participacion/validacion',
        canActivate: [authGuard, rolGuard('COORDINADOR', 'ADMIN')],
        loadComponent: () =>
          import('./features/participacion/validacion/validacion').then((m) => m.Validacion),
      },
      {
        path: 'participacion/reporte',
        canActivate: [authGuard, rolGuard('COORDINADOR', 'ADMIN')],
        loadComponent: () =>
          import('./features/participacion/registro/registro-reporte').then(
            (m) => m.RegistroReporteComponent,
          ),
      },
      {
        path: 'premios/categorias',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/premios/categoria-premio/categoria-premio-list').then(
            (m) => m.CategoriaPremioList,
          ),
      },
      {
        path: 'premios/catalogo',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/premios/premio/premio-list').then((m) => m.PremioList),
      },
      {
        path: 'premios/actas',
        canActivate: [authGuard, rolGuard('COORDINADOR', 'ADMIN')],
        loadComponent: () =>
          import('./features/premios/acta-premiacion/acta-premiacion-list').then(
            (m) => m.ActaPremiacionList,
          ),
      },
      {
        path: 'sin-permiso',
        loadComponent: () => import('./core/sin-permiso/sin-permiso').then((m) => m.SinPermiso),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];