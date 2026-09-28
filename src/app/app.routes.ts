import { Routes } from '@angular/router';

export const routes: Routes = [
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
        loadComponent: () =>
          import('./features/catalogo/categoria/categoria-list').then((m) => m.CategoriaList),
      },
      {
        path: 'catalogo/categorias/nueva',
        loadComponent: () =>
          import('./features/catalogo/categoria/categoria-form').then((m) => m.CategoriaForm),
      },
      {
        path: 'catalogo/categorias/:id/editar',
        loadComponent: () =>
          import('./features/catalogo/categoria/categoria-form').then((m) => m.CategoriaForm),
      },
      {
        path: 'campanias/categorias-habito',
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-list').then(
            (m) => m.CategoriaHabitoList,
          ),
      },
      {
        path: 'campanias/categorias-habito/nueva',
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-form').then(
            (m) => m.CategoriaHabitoForm,
          ),
      },
      {
        path: 'campanias/categorias-habito/:id/editar',
        loadComponent: () =>
          import('./features/campanias/categoria-habito/categoria-habito-form').then(
            (m) => m.CategoriaHabitoForm,
          ),
      },
    ],
  },
];
