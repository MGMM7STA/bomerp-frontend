export type EstadoRegistro = 'BORRADOR' | 'ENVIADO' | 'VALIDADO' | 'RECHAZADO' | 'ANULADO';

export interface DetalleEvidenciaRequest {
  habitoId: number;
  veces: number;
  descripcion?: string;
  urlImagen?: string;
}

export interface RegistroRequest {
  detalles: DetalleEvidenciaRequest[];
}

export interface DetalleEvidenciaResponse {
  id: number;
  habitoId: number;
  nombreHabito: string;
  descripcion?: string;
  urlImagen?: string;
  puntajeUnitario: number;
  veces: number;
  subtotal: number;
  estado: EstadoRegistro;
  motivoRechazo?: string | null;
  tieneFoto: boolean;
}

export interface RegistroResponse {
  id: number;
  estudianteId: number;
  campaniaId: number;
  sede?: string | null;
  fecha: string;
  estado: EstadoRegistro;
  totalEvidencias: number;
  puntajeTotal: number;
  puntajeValidado: number;
  motivoRechazo?: string | null;
  revisadoPor?: string | null;
  fechaRevision?: string | null;
  detalles: DetalleEvidenciaResponse[];
}

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
  primera: boolean;
  ultima: boolean;
}

export interface RegistroTotales {
  totalRegistros: number;
  evidenciasTotales: number;
  puntajeValidado: number;
  puntajePromedio: number;
  habitoMasRegistrado: string | null;
  vecesHabito: number;
}
