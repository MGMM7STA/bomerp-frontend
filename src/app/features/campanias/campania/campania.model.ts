export type EstadoCampania = 'BORRADOR' | 'ACTIVA' | 'CERRADA';

export interface Campania {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  maxEvidenciasDia: number;
  estado: EstadoCampania;
  habitoIds: number[];
}

export interface CampaniaRequest {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  maxEvidenciasDia: number;
  estado: EstadoCampania;
  habitoIds: number[];
}
