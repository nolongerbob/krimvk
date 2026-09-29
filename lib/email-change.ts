import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmailChangeConfirmation } from '@/lib/resend';
import { syncProfileEmailTo1C } from '@/lib/utility-account-email';

const lifetime = 30 * 60 * 1000;
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const prefix = (id: string) => `email-change:${id}:`;
export class EmailChangeError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function requestEmailChange(userId: string, newEmail: string) {
  const token = randomBytes(32).toString('hex');
  const digest = hash(token);
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new EmailChangeError('Пользователь не найден', 404);
    if (user.email?.toLowerCase() === newEmail) throw new EmailChangeError('Этот email уже указан в профиле');
    const pending = await tx.verificationToken.findFirst({ where: { identifier: { startsWith: prefix(userId) }, expires: { gt: new Date(Date.now() + lifetime - 60_000) } } });
    if (pending) throw new EmailChangeError('Повторное письмо можно отправить через минуту', 429);
    const occupied = await tx.user.findFirst({ where: { email: { equals: newEmail, mode: 'insensitive' } } });
    if (occupied) throw new EmailChangeError('Этот адрес недоступен для смены email');
    await tx.verificationToken.deleteMany({ where: { identifier: { startsWith: prefix(userId) } } });
    await tx.verificationToken.create({ data: {
      identifier: prefix(userId) + JSON.stringify({ oldEmail: user.email, newEmail }),
      token: digest, expires: new Date(Date.now() + lifetime),
    } });
  });
  try {
    await sendEmailChangeConfirmation(newEmail, token);
  } catch {
    await prisma.verificationToken.deleteMany({ where: { token: digest } });
    throw new EmailChangeError('Не удалось отправить письмо. Прежний email не изменён. Попробуйте позже.', 503);
  }
}

export async function confirmEmailChange(userId: string, token: string) {
  try {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      const pending = await tx.verificationToken.findUnique({ where: { token: hash(token) } });
      if (!pending || !pending.identifier.startsWith(prefix(userId)) || pending.expires <= new Date()) {
        throw new EmailChangeError('Ссылка недействительна или истекла. Запросите новую в настройках.');
      }
      const { oldEmail, newEmail } = JSON.parse(pending.identifier.slice(prefix(userId).length));
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.email !== oldEmail) throw new EmailChangeError('Email уже изменён. Запросите новую ссылку.');
      const occupied = await tx.user.findFirst({ where: { email: { equals: newEmail, mode: 'insensitive' }, id: { not: userId } } });
      if (occupied) throw new EmailChangeError('Этот адрес недоступен для смены email');
      await tx.user.update({ where: { id: userId }, data: { email: newEmail, emailVerified: new Date() } });
      await tx.verificationToken.deleteMany({ where: { identifier: { startsWith: prefix(userId) } } });
      await tx.emailVerificationToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new EmailChangeError('Этот адрес недоступен для смены email');
    }
    throw error;
  }
  return syncProfileEmailTo1C(userId).catch(() => ({ synced: 0, pending: 1 }));
}
