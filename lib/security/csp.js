/**
 * Content-Security-Policy для Next.js (см. next.config.js).
 */
function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV !== 'production';

  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'object-src': ["'none'"],
    'script-src': scriptSrc,
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'media-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
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
