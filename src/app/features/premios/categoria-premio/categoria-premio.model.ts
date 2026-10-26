export interface CategoriaPremio {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface CategoriaPremioRequest {
  nombre: string;
  descripcion: string | null;
}
