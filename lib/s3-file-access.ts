/** Префиксы S3-ключей: публичные (без авторизации) и приватные. */

export const PUBLIC_S3_PREFIXES = [
  'disclosure/',
  'water-quality/',
  'news/',
  'pages/',
  'posts/',
  /** @deprecated legacy — только старые объекты; новые загрузки: posts/, pages/, news/ */
  'uploads/',
] as const;

/** Префиксы legacy uploads/, которые должны быть приватными (не отдавать с /files/). */
const LEGACY_PRIVATE_UPLOAD_PREFIXES = ['uploads/applications/', 'uploads/messages/', 'uploads/meters/', 'uploads/contracts/'] as const;

export const PRIVATE_S3_PREFIXES = [
  'applications/',
  'messages/',
  'meters/',
  'contracts/',
] as const;

export function isValidS3Key(key: string): boolean {
  return Boolean(key) && !key.includes('..') && !key.startsWith('/');
}

export function isPublicS3Key(key: string): boolean {
  if (!isValidS3Key(key)) return false;
  return PUBLIC_S3_PREFIXES.some((p) => key.startsWith(p));
}

export function isPrivateS3Key(key: string): boolean {
  if (!isValidS3Key(key)) return false;
  return PRIVATE_S3_PREFIXES.some((p) => key.startsWith(p));
}

export function isAllowedPublicS3Key(key: string): boolean {
  if (!isPublicS3Key(key)) return false;
  if (LEGACY_PRIVATE_UPLOAD_PREFIXES.some((p) => key.startsWith(p))) {
    return false;
  }
  return true;
}
