export interface DetalleEvidenciaRequest {
  habitoId: number;
  veces: number;
  descripcion?: string;
  urlImagen?: string;
}

export interface RegistroRequest {
  estudianteId: number;
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
  estado: string;
  totalEvidencias: number;
  puntajeTotal: number;
  detalles: DetalleEvidenciaResponse[];
}
