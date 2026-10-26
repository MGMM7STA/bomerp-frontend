
import {
  DetallePremiacion,
  DetallePremiacionRequest
} from './detalle-premiacion.model';

export type EstadoActaPremiacion = 'EMITIDA' | 'ANULADA';

export interface ActaPremiacion {
  id: number;
  campaniaId: number;
  fechaInicioPeriodo: string;
  fechaFinPeriodo: string;
  fechaEmision: string;
  estado: EstadoActaPremiacion;
  totalGanadores: number;
  totalPremiosEntregados: number;
  detalles: DetallePremiacion[];
}

export interface ActaPremiacionRequest {
  campaniaId: number;
  fechaInicioPeriodo: string;
  fechaFinPeriodo: string;
  detalles: DetallePremiacionRequest[];
}
