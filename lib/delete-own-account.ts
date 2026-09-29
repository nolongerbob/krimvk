import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { cacheDel } from '@/lib/cache/redis';
import { invalidateUserBalance } from '@/lib/admin-users-index';

export class AccountDeletionError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function deleteOwnAccount(userId: string, password: string) {
  // Lock the user against concurrent role/password changes until deletion commits.
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId }, select: {
      id: true, role: true, password: true,
      _count: { select: { news: true, pages: true, posts: true } },
    } });
    if (!user) throw new AccountDeletionError('Аккаунт не найден', 404);
    if (user.role === 'ADMIN' || user._count.news || user._count.pages || user._count.posts)
      throw new AccountDeletionError('Служебный аккаунт нельзя удалить самостоятельно. Обратитесь к другому администратору.', 409);
    if (!user.password) throw new AccountDeletionError('Сначала задайте пароль через восстановление доступа на подтверждённую почту. Если почта не подтверждена, обратитесь в поддержку.', 409);
    if (!await verifyPassword(password, user.password)) throw new AccountDeletionError('Неверный пароль', 403);
    await tx.verificationToken.deleteMany({ where: { identifier: { startsWith: `email-change:${userId}:` } } });
    // Explicit DB cascades remove site profile, OAuth links, sessions, utility
    // links, meters/readings, bills, requests and chats. No request to 1C.
    await tx.user.delete({ where: { id: userId } });
  }, { timeout: 15000 });
  await cacheDel(`admin-role:${userId}`);
  invalidateUserBalance(userId);
}
