export type DashboardAccountSummary = {
  balance: number;
  paid: number;
  charged: number;
  accountNumber: string;
  address: string;
  name: string | null;
};

function parseAmount(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, '.').replace(/\s/g, '');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Парсинг ответа 1С get_data для карточки на дашборде. */
export function parseDashboardAccountData(
  responseData: Record<string, unknown> | null | undefined,
  account: { accountNumber: string; address: string; name: string | null }
): DashboardAccountSummary {
  const balance = responseData?.CommonDuty ?? responseData?.commonDuty ?? 0;
  const paid =
    responseData?.CommonPayment ??
    responseData?.commonPayment ??
    0;
  const charges =
    (responseData?.ChargesAndPayments as unknown[]) ||
    (responseData?.chargesAndPayments as unknown[]) ||
    [];
  const charged =
    charges.length > 0
      ? (charges[0] as Record<string, unknown>)?.Charge ??
        (charges[0] as Record<string, unknown>)?.charge ??
        0
      : 0;

  return {
    balance: parseAmount(balance as string | number),
    paid: parseAmount(paid as string | number),
    charged: parseAmount(charged as string | number),
    accountNumber: account.accountNumber,
    address: account.address,
    name: account.name,
  };
}
