import { prisma } from '@/lib/prisma';
import { get1CUserData } from '@/lib/1c-api';
import { tryDecryptPassword1c } from '@/lib/password1c-crypto';
import { mapWithConcurrency } from '@/lib/map-with-concurrency';

export type DashboardStatsResult = {
  unpaidBills: number;
  totalAmount: number;
  metersCount: number;
  activeApplications: number;
};

function parseAmount(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, '.').replace(/\s/g, '');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function statsForAccount(account: {
  accountNumber: string;
  password1c: string | null;
  region: string | null;
}): Promise<{ unpaidBills: number; totalAmount: number; metersCount: number }> {
  const password1c = tryDecryptPassword1c(account.password1c);
  if (!password1c || !account.region) {
    return { unpaidBills: 0, totalAmount: 0, metersCount: 0 };
  }

  try {
    const data = (await Promise.race([
      get1CUserData(account.accountNumber, password1c, account.region),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('1C request timeout')), 10000)
      ),
    ])) as Record<string, unknown> | null;

    if (!data) {
      return { unpaidBills: 0, totalAmount: 0, metersCount: 0 };
    }

    let unpaidBills = 0;
    let totalAmount = 0;
    let metersCount = 0;

    const commonDuty = parseAmount(
      (data.CommonDuty || data.commonDuty || '0') as string | number
    );
    const debtAmount = Math.abs(commonDuty);
    const hasDebt = debtAmount > 0.01;

    if (hasDebt) {
      const billsList: { status: string; amount: number }[] = [];
      const startDutys = data.StartDutys as Array<Record<string, unknown>> | undefined;
      if (startDutys && Array.isArray(startDutys)) {
        startDutys.forEach((duty) => {
          const amount = parseAmount((duty.Duty || duty.duty || '0') as string | number);
          if (amount > 0) {
            billsList.push({ amount, status: 'OVERDUE' });
          }
        });
      }
      const startCommonDuty = parseAmount(
        (data.StartCommonDuty || data.startCommonDuty || '0') as string | number
      );
      if (
        Math.abs(startCommonDuty) > 0.01 &&
        (!startDutys || startDutys.length === 0)
      ) {
        billsList.push({ status: 'OVERDUE', amount: startCommonDuty });
      }
      const charges = data.ChargesAndPayments as Array<Record<string, unknown>> | undefined;
      if (charges && Array.isArray(charges)) {
        charges.forEach((charge) => {
          const amount = parseAmount(
            (charge.Charge || charge.ChargeFull || charge.charge || '0') as string | number
          );
          if (amount > 0) {
            billsList.push({ status: 'UNPAID', amount });
          }
        });
      }
      const totalUnpaidBillsAmount = billsList
        .filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE')
        .reduce((sum, b) => sum + b.amount, 0);
      const difference = debtAmount - totalUnpaidBillsAmount;
      if (difference > 0.01 && billsList.length > 0) {
        billsList.push({ status: 'OVERDUE', amount: difference });
      }
      if (billsList.length === 0 && hasDebt) {
        billsList.push({ status: 'UNPAID', amount: debtAmount });
      }
      unpaidBills = billsList.filter(
        (b) => b.status === 'UNPAID' || b.status === 'OVERDUE'
      ).length;
      totalAmount = debtAmount;
    }

    const devices = data.MeteringDevices as Array<Record<string, unknown>> | undefined;
    if (devices && Array.isArray(devices)) {
      metersCount = devices.filter((device) => {
        const service = String(
          device.Service || device.ServiceName || device.service || ''
        ).toLowerCase();
        const type = String(device.Type || device.type || '').toLowerCase();
        return service.includes('холод') || type.includes('холод');
      }).length;
    }

    return { unpaidBills, totalAmount, metersCount };
  } catch {
    return { unpaidBills: 0, totalAmount: 0, metersCount: 0 };
  }
}

export async function computeDashboardStats(userId: string): Promise<DashboardStatsResult> {
  const userAccounts = await prisma.userAccount.findMany({
    where: { userId, isActive: true },
  });

  const perAccount = await mapWithConcurrency(userAccounts, 2, (account) =>
    statsForAccount(account)
  );

  let totalUnpaidBills = 0;
  let totalAmount = 0;
  let totalMetersCount = 0;
  for (const row of perAccount) {
    totalUnpaidBills += row.unpaidBills;
    totalAmount += row.totalAmount;
    totalMetersCount += row.metersCount;
  }

  if (totalMetersCount === 0 && userAccounts.length > 0) {
    totalMetersCount = await prisma.waterMeter.count({
      where: { accountId: { in: userAccounts.map((a) => a.id) } },
    });
  }

  const activeApplications = await prisma.application.count({
    where: {
      userId,
      status: { in: ['PENDING', 'IN_PROGRESS'] as ('PENDING' | 'IN_PROGRESS')[] },
    },
  });

  return {
    unpaidBills: Number(totalUnpaidBills) || 0,
    totalAmount: Number(totalAmount) || 0,
    metersCount: Number(totalMetersCount) || 0,
    activeApplications: Number(activeApplications) || 0,
  };
}
