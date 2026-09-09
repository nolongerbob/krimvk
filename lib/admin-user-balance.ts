import { prisma, withRetry } from '@/lib/prisma';
import { get1CUserData } from '@/lib/1c-api';
import { tryDecryptPassword1c } from '@/lib/password1c-crypto';

const parseAmount = (value: unknown): number => {
  if (value === null || value === undefined || value === '') throw new Error('Missing balance');
  const normalized = String(value).replace(/,/g, '.').replace(/\s/g, '');
  if (!normalized) throw new Error('Missing balance');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error('Invalid balance');
  return parsed;
};

type BalanceSource = {
  userAccounts: { accountNumber: string; password1c: string | null; region: string | null }[];
  bills: { amount: number }[];
};

export async function loadAdminUserBalance(userId: string, source?: BalanceSource) {
  const userAccounts = source?.userAccounts ?? await withRetry(() =>
    prisma.userAccount.findMany({
      where: { userId, isActive: true },
    })
  );

  let totalBalance = 0;
  let unpaidBillsCount = 0;
  let incomplete = false;

  for (const account of userAccounts) {
    if (!account.region) { incomplete = true; continue; }
    const password = tryDecryptPassword1c(account.password1c);
    if (!password) { incomplete = true; continue; }

    try {
      const responseData = await get1CUserData(
        account.accountNumber,
        password,
        account.region
      );
      const commonDutyAmount = parseAmount(
        responseData.CommonDuty ?? responseData.commonDuty
      );
      totalBalance += commonDutyAmount;
      if (commonDutyAmount > 0.01) unpaidBillsCount += 1;
    } catch {
      incomplete = true;
    }
  }

  const localBills = source?.bills ?? await withRetry(() =>
    prisma.bill.findMany({
      where: {
        userId,
        status: { in: ['UNPAID', 'OVERDUE'] },
      },
    })
  );

  const localDebt = localBills.reduce((sum, bill) => sum + bill.amount, 0);
  if (localDebt > 0 && localDebt > totalBalance) {
    totalBalance = localDebt;
    unpaidBillsCount = Math.max(unpaidBillsCount, localBills.length);
  }

  if (incomplete) {
    throw new Error('Не удалось получить полный баланс');
  }
  return { totalDebt: totalBalance, unpaidBillsCount };
}
