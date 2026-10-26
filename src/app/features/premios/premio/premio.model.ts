export interface CategoriaPremioResumen {
  id: number;
  nombre: string;
}

export interface Premio {
  id: number;
  nombre: string;
  descripcion: string | null;
  stock: number;
  activo: boolean;
  categoria: CategoriaPremioResumen;
}

export interface PremioRequest {
  nombre: string;
  descripcion: string | null;
  stock: number;
  activo: boolean;
  categoriaId: number;
}
