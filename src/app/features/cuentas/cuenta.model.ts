export type RolCuenta = 'ESTUDIANTE' | 'COORDINADOR' | 'ADMIN';

export interface Cuenta {
  id: string;
  usuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolCuenta | null;
  sede: string | null;
  activa: boolean;
  creadaEn: string | null;
}

export interface CuentaRequest {
  usuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: RolCuenta;
  contrasenia: string;
  sede: string | null;
}
