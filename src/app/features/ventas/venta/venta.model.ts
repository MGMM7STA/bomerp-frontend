export interface DetalleVentaRequest {
  productoId: number;
  cantidad: number;
}

export interface DetalleVentaResponse {
  productoId: number;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface VentaRequest {
  detalles: DetalleVentaRequest[];
}

export interface VentaResponse {
  id: number;
  fecha: string;
  estado: string;
  total: number;
  detalles: DetalleVentaResponse[];
}

export interface VentaResumen {
  id: number;
  fecha: string;
  estado: string;
  total: number;
  cantidadDetalles: number;
}

export interface VentaAgregado {
  totalVentas: number;
  montoTotal: number;
  ticketPromedio: number;
}

export interface VentaReporte {
  agregado: VentaAgregado;
  ventas: VentaResumen[];
}