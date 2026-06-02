import { isAdminUser } from '@/lib/admin-role';
import { prisma } from '@/lib/prisma';
import { isPrivateS3Key } from '@/lib/s3-file-access';
import {
  isLegacyMessageImageKey,
  isUserOwnedMessageImageKey,
} from '@/lib/message-image-access';

/**
 * Доступ к приватным файлам в S3 (после входа).
 */
export async function canAccessPrivateS3Key(
  key: string,
  userId: string,
  sessionRole: string | undefined
): Promise<boolean> {
  if (!isPrivateS3Key(key)) return false;
  // JWT role может устареть после снятия админки — подтверждаем в БД (как requireAdmin).
  if (sessionRole === 'ADMIN' && (await isAdminUser(userId))) {
    return true;
  }

  if (key.startsWith('applications/user/')) {
    const rest = key.slice('applications/user/'.length);
    if (rest.startsWith(`user_${userId}_`)) return true;
    if (rest.startsWith(`${userId}/`)) return true;
    return false;
  }

  if (key.startsWith('applications/')) {
    const file = await prisma.applicationFile.findFirst({
      where: {
        filePath: { contains: key },
        application: { userId },
      },
      select: { id: true },
    });
    return Boolean(file);
  }

  if (key.startsWith('messages/')) {
    if (isUserOwnedMessageImageKey(key, userId)) {
      return true;
    }
    // Старые ключи без userId в пути — только если уже привязаны к сообщению пользователя
    if (isLegacyMessageImageKey(key)) {
      const msg = await prisma.message.findFirst({
        where: {
          imageUrl: { contains: key },
          question: { userId },
          isFromAdmin: false,
        },
        select: { id: true },
      });
      return Boolean(msg);
    }
    return false;
  }

  if (key.startsWith('meters/')) {
    const name = key.slice('meters/'.length);
    const match = name.match(/^([^_]+)_([^_]+)_/);
    if (!match) return false;
    const [, ownerId, meterId] = match;
    if (ownerId !== userId) return false;
    const meter = await prisma.waterMeter.findFirst({
      where: { id: meterId, userId },
      select: { id: true },
    });
    return Boolean(meter);
  }

  if (key.startsWith('contracts/')) {
    const doc = await prisma.contractDocument.findFirst({
      where: {
        fileUrl: { contains: key },
        contract: {
          OR: [{ userId }, { application: { userId } }],
        },
      },
      select: { id: true },
    });
    return Boolean(doc);
  }

  return false;
}
