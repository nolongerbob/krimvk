/** Префиксы S3-ключей: публичные (без авторизации) и приватные. */

export const PUBLIC_S3_PREFIXES = [
  'disclosure/',
  'water-quality/',
  'news/',
  'pages/',
  'posts/',
  'uploads/',
] as const;

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
  return isPublicS3Key(key);
}
