import { prisma } from '@/lib/prisma';
import { invalidateUserBalance } from '@/lib/admin-users-index';

/** Delete only the website association. WaterMeter.accountId uses SET NULL;
 * meters/readings, bills and the external 1C account are not deleted. */
export async function unlinkUserAccount(userId: string, accountId: string) {
  const result = await prisma.userAccount.deleteMany({ where: { id: accountId, userId } });
  if (result.count > 0) invalidateUserBalance(userId);
  return result.count > 0;
}
