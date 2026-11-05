const LADO_MAXIMO = 1600;
const CALIDAD = 0.82;

export async function comprimirImagen(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  const contexto = lienzo.getContext('2d');
  if (!contexto) {
    imagen.close();
    return archivo;
  }
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((resolver) =>
    lienzo.toBlob((blob) => resolver(blob ?? archivo), 'image/jpeg', CALIDAD),
  );
}
