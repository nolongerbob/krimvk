import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendUtilityPasswordRecovery } from '@/lib/resend';
import { assertUtilityWritesEnabled } from '@/lib/1c-account-access';
import { supportsUtilityAccess, UtilityAccessError } from '@/lib/utility-access-policy';

export const recoveryHash = (value: string) => createHash('sha256').update(value).digest('hex');
export const recoveryPrefix = (userId: string) => `utility-recovery:${userId}:`;
export const RECOVERY_MESSAGE = 'Если этот счёт связан с подтверждённой почтой вашего личного кабинета, письмо отправлено. Проверьте почту и папку «Спам». Если письма нет, обратитесь к оператору.';

export async function requestUtilityPasswordRecovery(userId: string, accountNumber: string, region: string) {
  if (!supportsUtilityAccess(region)) throw new UtilityAccessError('Восстановление доступно только для Сакского района.');
  assertUtilityWritesEnabled();
  const raw = randomBytes(32).toString('hex');
  const token = recoveryHash(raw), key = `${region}:${accountNumber}`;
  const email = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
    const access = await tx.utilityAccountAccess.findUnique({ where: { key } });
    const linked = await tx.userAccount.findFirst({ where: { accountNumber, region }, select: { userId: true } });
    // A verified mailbox alone does NOT prove ownership of an arbitrary account number.
    if (!user?.emailVerified || access?.userId !== userId || !access.emailSyncedAt || access.email !== user.email.toLowerCase() || (linked && linked.userId !== userId)) return null;
    const identifier = recoveryPrefix(userId) + JSON.stringify({ accountNumber, region, email: access.email });
    const recent = await tx.verificationToken.findFirst({ where: { identifier, expires: { gt: new Date(Date.now() + 14 * 60_000) } } });
    if (recent) return null;
    await tx.verificationToken.deleteMany({ where: { identifier } });
    await tx.verificationToken.create({ data: { identifier, token, expires: new Date(Date.now() + 15 * 60_000) } });
    return access.email;
  });
  if (email) {
    try { await sendUtilityPasswordRecovery(email, raw, accountNumber); }
    catch {
      await prisma.verificationToken.deleteMany({ where: { token } });
      throw new UtilityAccessError('Не удалось отправить письмо. Пароль не изменён. Попробуйте позже.', 503);
    }
  }
  return RECOVERY_MESSAGE;
}
