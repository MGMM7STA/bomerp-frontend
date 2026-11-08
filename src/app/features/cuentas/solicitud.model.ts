import { Cuenta } from './cuenta.model';

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudCuenta {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  codigoUniversitario: string | null;
  dni: string | null;
  escuela: string | null;
  ciclo: number | null;
  celular: string | null;
  sede: string | null;
  tieneCarne: boolean;
  estado: EstadoSolicitud;
  motivoRechazo: string | null;
  fechaSolicitud: string;
  fechaRevision: string | null;
  revisadoPor: string | null;
  usuarioCreado: string | null;
}

export interface Aprobacion {
  solicitud: SolicitudCuenta;
  cuenta: Cuenta;
  correoEnviado: boolean;
  contraseniaTemporal: string | null;
}
