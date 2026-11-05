export function aFechaLocal(iso: string): Date {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function diasRestantes(fechaFin: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = aFechaLocal(fechaFin);
  return Math.max(0, Math.round((fin.getTime() - hoy.getTime()) / 86_400_000));
}

export function claveDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function fechaCorta(iso: string): string {
  return aFechaLocal(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

export function etiquetaDia(clave: string): string {
  return aFechaLocal(clave).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
}
