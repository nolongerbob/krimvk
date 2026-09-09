import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma, withRetry } from '@/lib/prisma';
import { get1CUserData } from '@/lib/1c-api';
import { tryDecryptPassword1c } from '@/lib/password1c-crypto';

export const dynamic = 'force-dynamic';

const parseAmount = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, '.').replace(/\s/g, '');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id: userId } = await params;

  const userAccounts = await withRetry(() =>
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
        responseData.CommonDuty || responseData.commonDuty || '0'
      );
      totalBalance += commonDutyAmount;
      if (commonDutyAmount > 0.01) unpaidBillsCount += 1;
    } catch (error) {
      incomplete = true;
      console.error(`Balance fetch failed for ${account.accountNumber}:`, error);
    }
  }

  const localBills = await withRetry(() =>
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
    return NextResponse.json({ error: 'Не удалось получить полный баланс' }, { status: 503 });
  }
  return NextResponse.json({ totalDebt: totalBalance, unpaidBillsCount });
}
