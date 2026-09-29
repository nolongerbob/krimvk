import 'server-only';
import { prisma } from '@/lib/prisma';
import { update1CAccountEmail, assertUtilityWritesEnabled } from '@/lib/1c-account-access';
import { supportsUtilityAccess, UtilityAccessError } from '@/lib/utility-access-policy';

export async function syncUtilityAccountEmail(userId: string, accountNumber: string, region: string, completedChangeId?: string) {
  if (!supportsUtilityAccess(region)) return 'unsupported' as const;
  assertUtilityWritesEnabled();
  return prisma.$transaction(async tx => {
    const key = `${region}:${accountNumber}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
    if (!user?.emailVerified) return 'unverified' as const;
    const linked = await tx.userAccount.findFirst({ where: { accountNumber, region, isActive: true }, select: { userId: true } });
    if (linked && linked.userId !== userId) throw new UtilityAccessError('Этот счёт привязан к другому пользователю.', 409);
    if (!linked) {
      const proof = completedChangeId && await tx.utilityPasswordChange.findFirst({ where: { id: completedChangeId, userId, accountKey: key, status: 'COMPLETED' } });
      if (!proof) throw new UtilityAccessError('Сначала подтвердите привязку лицевого счёта.', 403);
    }
    const email = user.email.trim().toLowerCase();
    const previous = await tx.utilityAccountAccess.findUnique({ where: { key } });
    if (previous?.email === email && previous.userId === userId && previous.emailSyncedAt) return 'synced' as const;
    await update1CAccountEmail(accountNumber, email, region);
    await tx.utilityAccountAccess.upsert({ where: { key }, create: { key, userId, email, emailSyncedAt: new Date() }, update: { userId, email, emailSyncedAt: new Date() } });
    return 'synced' as const;
  }, { timeout: 25_000 });
}

/** Only call following an explicit account link or email verification/change, never from a read route. */
export async function syncProfileEmailTo1C(userId: string) {
  const accounts = await prisma.userAccount.findMany({ where: { userId, isActive: true, region: 'saki' }, select: { accountNumber: true, region: true } });
  const result = { synced: 0, pending: 0 };
  for (const account of accounts) {
    try {
      const status = await syncUtilityAccountEmail(userId, account.accountNumber, account.region!);
      if (status === 'synced') result.synced++; else result.pending++;
    } catch { result.pending++; }
  }
  return result;
}
