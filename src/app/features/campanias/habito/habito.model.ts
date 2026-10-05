import { CategoriaHabitoResumen } from '../categoria-habito/categoria-habito.model';

export interface Habito {
  id: number;
  nombre: string;
  descripcion?: string;
  puntajeBase: number;
  activo: number;
  categoria: CategoriaHabitoResumen;
}

export interface HabitoRequest {
  categoriaId: number;
  nombre: string;
  descripcion?: string;
  puntajeBase: number;
  activo: number;
}
