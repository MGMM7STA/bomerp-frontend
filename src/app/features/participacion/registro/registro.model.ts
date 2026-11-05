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
  habitoId: number;
  nombreHabito: string;
  descripcion?: string;
  urlImagen?: string;
  puntajeUnitario: number;
  veces: number;
  subtotal: number;
}

export interface RegistroResponse {
  id: number;
  estudianteId: number;
  campaniaId: number;
  fecha: string;
  estado: EstadoRegistro;
  totalEvidencias: number;
  puntajeTotal: number;
  motivoRechazo?: string | null;
  revisadoPor?: string | null;
  fechaRevision?: string | null;
  detalles: DetalleEvidenciaResponse[];
}
