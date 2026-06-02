/**
 * Content-Security-Policy для Next.js (см. next.config.js).
 */
function staticAssetCdnOrigin() {
  const raw = process.env.NEXT_PUBLIC_ASSET_PREFIX?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV !== 'production';
  const cdnOrigin = staticAssetCdnOrigin();

  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }
  if (cdnOrigin) {
    scriptSrc.push(cdnOrigin);
  }

  const styleSrc = ["'self'", "'unsafe-inline'"];
  if (cdnOrigin) {
    styleSrc.push(cdnOrigin);
  }

  const fontSrc = ["'self'", 'data:'];
  if (cdnOrigin) {
    fontSrc.push(cdnOrigin);
  }

  const workerSrc = ["'self'", 'blob:'];
  if (cdnOrigin) {
    workerSrc.push(cdnOrigin);
  }

  const directives = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'script-src': scriptSrc,
    'style-src': styleSrc,
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': fontSrc,
    'connect-src': ["'self'"],
    'media-src': ["'self'"],
    'worker-src': workerSrc,
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([name, values]) =>
      values.length === 0 ? name : `${name} ${values.join(' ')}`
    )
    .join('; ');
}

module.exports = { buildContentSecurityPolicy };
