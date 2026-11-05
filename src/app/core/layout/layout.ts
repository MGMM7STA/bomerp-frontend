import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth-service';

interface ItemMenu {
  ruta: string;
  icono: string;
  texto: string;
  roles: string[];
  exacto?: boolean;
  corto?: string;
}

interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

const TODOS = ['ESTUDIANTE', 'COORDINADOR', 'ADMIN'];
const COORDINACION = ['COORDINADOR', 'ADMIN'];

const GRUPOS: GrupoMenu[] = [
  {
    titulo: '',
    items: [{ ruta: '/', icono: 'home', texto: 'Inicio', roles: TODOS, exacto: true }],
  },
  {
    titulo: 'Mi participación',
    items: [
      { ruta: '/participacion/registrar', icono: 'add_task', texto: 'Registrar', roles: ['ESTUDIANTE'] },
      { ruta: '/participacion/mis-registros', icono: 'history', texto: 'Mis registros', roles: ['ESTUDIANTE'] },
    ],
  },
  {
    titulo: 'Seguimiento',
    items: [
      { ruta: '/participacion/validacion', icono: 'fact_check', texto: 'Validar evidencias', corto: 'Validar', roles: COORDINACION },
      { ruta: '/participacion/reporte', icono: 'monitoring', texto: 'Reporte', roles: COORDINACION },
    ],
  },
  {
    titulo: 'Configuración',
    items: [
      { ruta: '/campanias', icono: 'campaign', texto: 'Campañas', roles: ['ADMIN'], exacto: true },
      { ruta: '/campanias/habitos', icono: 'self_improvement', texto: 'Hábitos', roles: COORDINACION },
      { ruta: '/campanias/categorias-habito', icono: 'sell', texto: 'Categorías de hábito', roles: ['ADMIN'] },
      { ruta: '/cuentas', icono: 'manage_accounts', texto: 'Cuentas', roles: ['ADMIN'] },
    ],
  },
  {
    titulo: 'Premios',
    items: [
      { ruta: '/premios/catalogo', icono: 'redeem', texto: 'Premios', roles: TODOS },
      { ruta: '/premios/categorias', icono: 'category', texto: 'Categorías de premio', roles: COORDINACION },
      { ruta: '/premios/actas', icono: 'workspace_premium', texto: 'Actas de premiación', roles: COORDINACION },
    ],
  },
];

const MOVIL: Record<string, string[]> = {
  ESTUDIANTE: ['/', '/participacion/registrar', '/participacion/mis-registros', '/premios/catalogo'],
  COORDINADOR: ['/', '/participacion/validacion', '/participacion/reporte'],
  ADMIN: ['/', '/participacion/validacion', '/campanias'],
};

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuAbierto = signal(false);

  protected readonly rolPrincipal = computed(() => {
    const roles = this.auth.roles();
    return ['ADMIN', 'COORDINADOR', 'ESTUDIANTE'].find((rol) => roles.includes(rol)) ?? '';
  });

  protected readonly nombreRol = computed(() => {
    const nombres: Record<string, string> = {
      ADMIN: 'Administrador',
      COORDINADOR: 'Coordinación',
      ESTUDIANTE: 'Estudiante',
    };
    return nombres[this.rolPrincipal()] ?? '';
  });

  protected readonly grupos = computed(() =>
    GRUPOS.map((grupo) => ({
      titulo: grupo.titulo,
      items: grupo.items.filter((item) => this.auth.tieneRol(...item.roles)),
    })).filter((grupo) => grupo.items.length > 0),
  );

  private readonly todos = computed(() => this.grupos().flatMap((grupo) => grupo.items));

  protected readonly barraMovil = computed(() => {
    const rutas = MOVIL[this.rolPrincipal()] ?? ['/'];
    return this.todos().filter((item) => rutas.includes(item.ruta));
  });

  protected readonly hayMas = computed(() => this.todos().length > this.barraMovil().length);

  protected readonly iniciales = computed(() => {
    const nombre = this.auth.usuario()?.nombre ?? '';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('');
  });

  constructor() {
    this.router.events
      .pipe(filter((evento) => evento instanceof NavigationEnd))
      .subscribe(() => this.menuAbierto.set(false));
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }
}
