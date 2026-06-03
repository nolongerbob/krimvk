import type { Prisma } from '@prisma/client';

type AccountWithMeters = Prisma.UserAccountGetPayload<{
  include: {
    meters: { include: { readings: true } };
  };
}>;

export function formatUserAccountsForApi(accounts: AccountWithMeters[]) {
  return accounts
    .map((account) => {
      const meters = (account.meters || []).map((meter) => ({
        id: String(meter.id),
        serialNumber: String(meter.serialNumber || ''),
        type: String(meter.type || ''),
        address: String(meter.address || ''),
        lastReading:
          meter.lastReading !== null && meter.lastReading !== undefined
            ? Number(meter.lastReading)
            : null,
        readings: (meter.readings || []).map((reading) => ({
          value: Number(reading.value) || 0,
          readingDate:
            reading.readingDate instanceof Date
              ? reading.readingDate.toISOString()
              : new Date(reading.readingDate).toISOString(),
        })),
      }));

      return {
        id: String(account.id),
        accountNumber: String(account.accountNumber || ''),
        address: String(account.address || ''),
        name: account.name ? String(account.name) : null,
        phone: account.phone ? String(account.phone) : null,
        region: account.region ? String(account.region) : null,
        meters,
      };
    })
    .filter(Boolean);
}
