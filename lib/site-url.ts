/**
 * Публичный URL сайта (письма, редиректы NextAuth, ссылки на файлы).
 * На VPS не используйте IP в NEXTAUTH_URL после привязки домена — только https://krimvk.ru
 */

const PRODUCTION_DEFAULT = 'https://krimvk.ru';
const IP_HOST_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function isIpHostname(hostname: string): boolean {
  return IP_HOST_RE.test(hostname);
}

function parseBaseUrl(raw: string): string | null {
  try {
    const withProto = raw.includes('://') ? raw : `https://${raw}`;
    const u = new URL(withProto);
    if (!u.hostname) return null;
    return stripTrailingSlash(`${u.protocol}//${u.host}`);
  } catch {
    return null;
  }
}

function isIpBaseUrl(baseUrl: string): boolean {
  try {
    return isIpHostname(new URL(baseUrl).hostname);
  } catch {
    return false;
  }
}

/** Канонический URL для ссылок в письмах и публичных href. */
export function getSiteBaseUrl(): string {
  const candidates = [process.env.SITE_URL, process.env.NEXTAUTH_URL].filter(
    Boolean
  ) as string[];

  const allowIp = process.env.ALLOW_IP_PUBLIC_URL === '1';

  for (const raw of candidates) {
    const parsed = parseBaseUrl(raw);
    if (!parsed) continue;
    if (
      process.env.NODE_ENV === 'production' &&
      isIpBaseUrl(parsed) &&
      !allowIp
    ) {
      continue;
    }
    return parsed;
  }

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_DEFAULT;
  }

  return parseBaseUrl(process.env.NEXTAUTH_URL || '') || 'http://localhost:3000';
}

/**
 * В production подменяет NEXTAUTH_URL, если в .env остался IP (ломает выход и письма).
 * Вызывается из instrumentation.ts при старте Node.
 */
export function applyCanonicalSiteUrl(): void {
  const canonical = getSiteBaseUrl();
  const current = process.env.NEXTAUTH_URL
    ? stripTrailingSlash(process.env.NEXTAUTH_URL)
    : '';

  if (!current) {
    process.env.NEXTAUTH_URL = canonical;
    return;
  }

  if (
    process.env.NODE_ENV === 'production' &&
    isIpBaseUrl(current) &&
    process.env.ALLOW_IP_PUBLIC_URL !== '1'
  ) {
    console.warn(
      `[site-url] NEXTAUTH_URL=${current} — IP в production; используем ${canonical}. ` +
        'Исправьте .env: NEXTAUTH_URL=https://krimvk.ru'
    );
    process.env.NEXTAUTH_URL = canonical;
    return;
  }

  if (process.env.SITE_URL) {
    const site = parseBaseUrl(process.env.SITE_URL);
    if (site && site !== current) {
      process.env.NEXTAUTH_URL = site;
    }
  }
}
