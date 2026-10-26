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
        path: 'catalogo/categorias',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/catalogo/categoria/categoria-list').then((m) => m.CategoriaList),
      },
      {
        path: 'catalogo/categorias/nueva',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/catalogo/categoria/categoria-form').then((m) => m.CategoriaForm),
      },
      {
        path: 'catalogo/categorias/:id/editar',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/catalogo/categoria/categoria-form').then((m) => m.CategoriaForm),
      },
      {
        path: 'catalogo/productos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/catalogo/producto/producto-list').then((m) => m.ProductoList),
      },
      {
        path: 'catalogo/productos/nuevo',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/catalogo/producto/producto-form').then((m) => m.ProductoForm),
      },
      {
        path: 'catalogo/productos/:id/editar',
        canActivate: [authGuard, rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/catalogo/producto/producto-form').then((m) => m.ProductoForm),
      },
      {
        path: 'campanias/categorias-habito',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-list').then(
            (m) => m.CategoriaHabitoList,
          ),
      },
      {
        path: 'campanias/categorias-habito/nueva',
        canActivate: [authGuard, rolGuard('COORDINADOR', 'ADMIN')],
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-form').then(
            (m) => m.CategoriaHabitoForm,
          ),
      },
      {
        path: 'campanias/categorias-habito/:id/editar',
        canActivate: [authGuard, rolGuard('COORDINADOR', 'ADMIN')],
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-form').then(
            (m) => m.CategoriaHabitoForm,
          ),
      },
      {
        path: 'campanias/habitos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/campanias/habito/habito-list').then((m) => m.HabitoList),
      },
      {
        path: 'campanias/habitos/nuevo',
        canActivate: [authGuard, rolGuard('COORDINADOR', 'ADMIN')],
        loadComponent: () =>
          import('./features/campanias/habito/habito-form').then((m) => m.HabitoForm),
      },
      {
        path: 'campanias/habitos/:id/editar',
        canActivate: [authGuard, rolGuard('COORDINADOR', 'ADMIN')],
        loadComponent: () =>
          import('./features/campanias/habito/habito-form').then((m) => m.HabitoForm),
      },
      {
        path: 'ventas/nueva',
        canActivate: [authGuard, rolGuard('VENDEDOR', 'SUPERVISOR')],
        loadComponent: () => import('./features/ventas/venta/venta-form').then((m) => m.VentaForm),
      },
      {
        path: 'ventas/reporte',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/ventas/venta/venta-reporte').then((m) => m.VentaReporteComponent),
      },
      {
        path: 'participacion/nuevo',
        canActivate: [authGuard, rolGuard('ESTUDIANTE', 'COORDINADOR')],
        loadComponent: () =>
          import('./features/participacion/registro/registro-form').then((m) => m.RegistroForm),
      },
      {
        path: 'participacion/reporte',
        canActivate: [authGuard],
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
];