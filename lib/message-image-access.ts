import { s3KeyFromStoredUrl } from '@/lib/file-url';

/** Старые загрузки: messages/{timestamp}_{name} (без userId в пути) */
const LEGACY_MESSAGE_IMAGE_KEY = /^messages\/\d+_/;

export function buildMessageImageS3Key(userId: string, fileName: string): string {
  return `messages/${userId}/${fileName}`;
}

export function isUserOwnedMessageImageKey(key: string, userId: string): boolean {
  return key.startsWith(`messages/${userId}/`);
}

export function isLegacyMessageImageKey(key: string): boolean {
  return (
    key.startsWith('messages/') &&
    !key.slice('messages/'.length).includes('/') &&
    LEGACY_MESSAGE_IMAGE_KEY.test(key)
  );
}

/**
 * Проверка imageUrl перед сохранением в Message (только свои загрузки).
 */
export function assertMessageImageUrlOwnedByUser(
  imageUrl: string,
  userId: string
): { ok: true } | { ok: false; error: string } {
  const key = s3KeyFromStoredUrl(imageUrl.trim());
  if (!key || !key.startsWith('messages/')) {
    return { ok: false, error: 'Недопустимый URL изображения' };
  }
  if (!isUserOwnedMessageImageKey(key, userId)) {
    return {
      ok: false,
      error: 'Изображение должно быть загружено через чат от вашего имени',
    };
  }
  return { ok: true };
}
