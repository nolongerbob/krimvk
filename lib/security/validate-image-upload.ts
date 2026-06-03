const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Блокирует SVG и подделку Content-Type (XSS в браузере при отдаче как image). */
export async function validateImageUpload(file: File): Promise<string | null> {
  let mime = (file.type || '').toLowerCase().split(';')[0]?.trim();
  if (mime === 'image/jpg') mime = 'image/jpeg';
  if (!mime || !ALLOWED_IMAGE_MIME.has(mime)) {
    return 'Разрешены только JPEG, PNG, WebP или GIF';
  }

  const head = await readFileHead(file, 12);
  if (!matchesImageMagic(head, mime)) {
    return 'Содержимое файла не совпадает с типом изображения';
  }

  return null;
}

async function readFileHead(file: File, len: number): Promise<Uint8Array> {
  const part = file.slice(0, len);
  if (typeof part.arrayBuffer === 'function') {
    return new Uint8Array(await part.arrayBuffer());
  }
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf.slice(0, len));
}

/** @internal exported for unit tests */
export function matchesImageMagic(head: Uint8Array, mime: string): boolean {
  if (head.length < 3) return false;

  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng =
    head.length >= 8 &&
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47;
  const isGif =
    head.length >= 6 &&
    head[0] === 0x47 &&
    head[1] === 0x49 &&
    head[2] === 0x46;
  const isWebp =
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50;

  switch (mime) {
    case 'image/jpeg':
      return isJpeg;
    case 'image/png':
      return isPng;
    case 'image/gif':
      return isGif;
    case 'image/webp':
      return isWebp;
    default:
      return false;
  }
}
