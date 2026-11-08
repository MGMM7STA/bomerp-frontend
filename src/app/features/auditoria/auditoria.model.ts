export interface EventoAuditoria {
  id: number;
  fecha: string;
  usuario: string;
  nombre: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: string | null;
  sede: string | null;
  traceId: string | null;
}

export interface PaginaEventos {
  contenido: EventoAuditoria[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
  primera: boolean;
  ultima: boolean;
}
