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
