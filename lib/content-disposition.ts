/** MIME, которые безопасно отдавать inline (без выполнения в контексте HTML). */
const INLINE_SAFE_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export function safeContentDisposition(
  contentType: string | undefined,
  fileName: string
): string {
  const mime = (contentType || '').split(';')[0]?.trim().toLowerCase() || '';
  const safeName =
    fileName.replace(/[^\w.\-() ]+/g, '_').slice(0, 200) || 'file';
  const mode = INLINE_SAFE_MIME.has(mime) ? 'inline' : 'attachment';
  return `${mode}; filename="${safeName.replace(/"/g, '')}"`;
}
