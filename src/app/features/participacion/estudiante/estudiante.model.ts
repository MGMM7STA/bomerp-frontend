export interface Estudiante {
  id: number;
  usuario: string;
  nombre: string;
  correo?: string | null;
  sede?: string | null;
}

export interface FilaRanking {
  posicion: number;
  estudianteId: number;
  nombre: string;
  escuela?: string | null;
  puntos: number;
  evidencias: number;
}

export interface Ranking {
  campaniaId: number | null;
  campania: string | null;
  sede: string | null;
  filas: FilaRanking[];
  mia: FilaRanking | null;
  participantes: number;
}
