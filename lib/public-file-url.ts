/**
 * Публичные ссылки на файлы в S3 через сайт (не storage.yandexcloud.net).
 * В адресной строке: https://ваш-домен.ru/files/disclosure/имя.pdf
 */

const ALLOWED_KEY_PREFIXES = [
  'disclosure/',
  'uploads/',
  'water-quality/',
  'news/',
  'applications/',
  'contracts/',
  'pages/',
  'posts/',
  'meters/',
  'messages/',
];

export function isAllowedPublicS3Key(key: string): boolean {
  if (!key || key.includes('..') || key.startsWith('/')) {
    return false;
  }
  return ALLOWED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function siteBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || process.env.SITE_URL || '').replace(/\/$/, '');
}

/** Относительный путь на сайте: /files/disclosure/doc.pdf */
export function publicFilePathForS3Key(key: string): string {
  const encoded = key.split('/').map((part) => encodeURIComponent(part)).join('/');
  return `/files/${encoded}`;
}

/** Ключ объекта из URL в БД (Yandex, /files/, /api/public-file). */
export function s3KeyFromStoredUrl(fileUrl: string): string | null {
  if (!fileUrl) return null;

  if (fileUrl.startsWith('/files/')) {
    const path = fileUrl.replace(/^\/files\//, '').split('?')[0];
    return path.split('/').map((p) => decodeURIComponent(p)).join('/');
  }

  if (fileUrl.startsWith('/api/public-file')) {
    try {
      const q = fileUrl.includes('?') ? fileUrl.slice(fileUrl.indexOf('?')) : '';
      const key = new URLSearchParams(q).get('key');
      return key ? decodeURIComponent(key) : null;
    } catch {
      return null;
    }
  }

  if (fileUrl.startsWith('/uploads/')) {
    return null;
  }

  try {
    const parsed = new URL(fileUrl, 'https://placeholder.local');
    if (parsed.pathname.startsWith('/files/')) {
      const path = parsed.pathname.replace(/^\/files\//, '');
      return path.split('/').map((p) => decodeURIComponent(p)).join('/');
    }
    if (parsed.pathname.startsWith('/api/public-file')) {
      const key = parsed.searchParams.get('key');
      return key ? decodeURIComponent(key) : null;
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    const bucket = process.env.S3_BUCKET_NAME;
    if (bucket && parts[0] === bucket) {
      return parts.slice(1).join('/');
    }
    if (parts.length >= 2) {
      return parts.slice(1).join('/');
    }
    return parts.join('/') || null;
  } catch {
    return null;
  }
}

/** Ссылка для <a href> — всегда ваш домен, не Yandex */
export function publicFileHref(fileUrl: string): string {
  const key = s3KeyFromStoredUrl(fileUrl);
  if (!key || !isAllowedPublicS3Key(key)) {
    return fileUrl;
  }
  return publicFilePathForS3Key(key);
}

/** URL при сохранении в БД после upload */
export function publicFileUrlForS3Key(key: string): string {
  const path = publicFilePathForS3Key(key);
  const base = siteBaseUrl();
  return base ? `${base}${path}` : path;
}
