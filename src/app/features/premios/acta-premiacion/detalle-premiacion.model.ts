
export interface DetallePremiacion {
  id: number;
  estudianteId: number;
  posicion: number;
  premioId: number;
  cantidad: number;
  puntajeAlcanzado: number;
}

export interface DetallePremiacionRequest {
  estudianteId: number;
  posicion: number;
  premioId: number;
  cantidad: number;
  puntajeAlcanzado: number;
}
