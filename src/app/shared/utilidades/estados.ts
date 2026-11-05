import { EstadoRegistro } from '../../features/participacion/registro/registro.model';

export interface EstiloEstado {
  texto: string;
  clase: string;
  icono: string;
}

const ESTILOS: Record<EstadoRegistro, EstiloEstado> = {
  BORRADOR: { texto: 'Borrador', clase: 'ss-badge-gris', icono: 'edit_note' },
  ENVIADO: { texto: 'Por validar', clase: 'ss-badge-pendiente', icono: 'schedule' },
  VALIDADO: { texto: 'Validado', clase: 'ss-badge-ok', icono: 'check_circle' },
  RECHAZADO: { texto: 'Rechazado', clase: 'ss-badge-rechazado', icono: 'cancel' },
  ANULADO: { texto: 'Anulado', clase: 'ss-badge-gris', icono: 'block' },
};

export function estiloEstado(estado: EstadoRegistro): EstiloEstado {
  return ESTILOS[estado] ?? ESTILOS.BORRADOR;
}

export function consumeCupo(estado: EstadoRegistro): boolean {
  return estado === 'ENVIADO' || estado === 'VALIDADO';
}
