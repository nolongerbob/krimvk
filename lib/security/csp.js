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
  const googleMapsEnabled = process.env.NEXT_PUBLIC_ACCOUNT_HOME_ENABLED !== 'false' && !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }
  if (cdnOrigin) {
    scriptSrc.push(cdnOrigin);
  }

  const styleSrc = ["'self'", "'unsafe-inline'"];
  if (googleMapsEnabled) {
    scriptSrc.push('https://maps.googleapis.com', 'https://maps.gstatic.com');
    styleSrc.push('https://fonts.googleapis.com');
  }
  if (cdnOrigin) {
    styleSrc.push(cdnOrigin);
  }

  const fontSrc = ["'self'", 'data:'];
  if (googleMapsEnabled) fontSrc.push('https://fonts.gstatic.com');
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
    // Only the configured account map gets external connections. The legacy
    // outage demonstration remains dev-only; no unsafe-eval is enabled in prod.
    'connect-src': ["'self'", ...(process.env.NODE_ENV === 'development' ? ['https://tiles.openfreemap.org'] : []), ...(googleMapsEnabled ? ['https://maps.googleapis.com', 'https://maps.gstatic.com', 'https://*.googleapis.com'] : [])],
    'media-src': ["'self'"],
    'worker-src': workerSrc,
    'manifest-src': ["'self'"],
  };

  if (!isDev) {
    directives['upgrade-insecure-requests'] = [];
  }

  return Object.entries(directives)
    .map(([name, values]) =>
      values.length === 0 ? name : `${name} ${values.join(' ')}`
    )
    .join('; ');
}

module.exports = { buildContentSecurityPolicy };
