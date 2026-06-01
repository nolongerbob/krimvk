import { getSiteBaseUrl } from '@/lib/site-url';
import {
  isPrivateS3Key,
  isPublicS3Key,
  isValidS3Key,
} from '@/lib/s3-file-access';

function encodeKeyPath(key: string): string {
  return key.split('/').map((p) => encodeURIComponent(p)).join('/');
}

/** Публичный путь /files/... */
export function publicFilePathForS3Key(key: string): string {
  return `/files/${encodeKeyPath(key)}`;
}

/** Приватный путь — только с сессией */
export function privateFilePathForS3Key(key: string): string {
  return `/api/files/private/${encodeKeyPath(key)}`;
}

/** URL для сохранения в БД после upload */
export function storedFileUrlForS3Key(key: string): string {
  const path = isPrivateS3Key(key)
    ? privateFilePathForS3Key(key)
    : publicFilePathForS3Key(key);
  const base = getSiteBaseUrl();
  return base ? `${base}${path}` : path;
}

/** Ключ из URL в БД */
export function s3KeyFromStoredUrl(fileUrl: string): string | null {
  if (!fileUrl) return null;

  if (fileUrl.startsWith('/files/')) {
    const path = fileUrl.replace(/^\/files\//, '').split('?')[0];
    return path.split('/').map((p) => decodeURIComponent(p)).join('/');
  }

  if (fileUrl.startsWith('/api/files/private/')) {
    const path = fileUrl.replace(/^\/api\/files\/private\//, '').split('?')[0];
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
    if (parsed.pathname.startsWith('/api/files/private/')) {
      const path = parsed.pathname.replace(/^\/api\/files\/private\//, '');
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

/** href для UI: старые /files/... на приватные ключи → /api/files/private/... */
export function fileHrefForStoredUrl(fileUrl: string): string {
  const key = s3KeyFromStoredUrl(fileUrl);
  if (!key || !isValidS3Key(key)) {
    return fileUrl;
  }
  if (isPrivateS3Key(key)) {
    return privateFilePathForS3Key(key);
  }
  if (isPublicS3Key(key)) {
    return publicFilePathForS3Key(key);
  }
  return fileUrl;
}
