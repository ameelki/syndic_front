/** Enregistre un Blob sur l'appareil (téléchargement). */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Réduit une photo (côté le plus long : 1600 px, JPEG 82 %) avant l'envoi : une photo d'iPhone pèse 3 à 6 Mo,
 * après réduction environ 300 Ko. En cas d'échec (format non lisible par le navigateur), le fichier d'origine est renvoyé.
 */
export async function compressImage(file: File, max = 1600, quality = 0.82): Promise<{ blob: Blob; name: string }> {
  try {
    const bmp = await createImageBitmap(file);
    const ratio = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * ratio);
    canvas.height = Math.round(bmp.height * ratio);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob) return { blob: file, name: file.name };
    return { blob, name: file.name.replace(/\.[^.]+$/, '') + '.jpg' };
  } catch {
    return { blob: file, name: file.name };
  }
}
