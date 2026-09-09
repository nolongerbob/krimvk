import type { Prisma } from '@prisma/client';

export type UserFilter = 'all' | 'admins' | 'debtors' | 'overpaid' | 'no-debt';
export function userFilter(value: unknown): UserFilter {
  return ['admins', 'debtors', 'overpaid', 'no-debt'].includes(String(value)) ? value as UserFilter : 'all';
}
export function userSearch(query: string): Prisma.UserWhereInput {
  const contains = { contains: query, mode: 'insensitive' as const };
  return query ? { OR: [
    { name: contains }, { email: contains }, { phone: contains }, { address: contains },
    { userAccounts: { some: { OR: [{ accountNumber: contains }, { address: contains }] } } },
  ] } : {};
}
export type BalanceResult = { totalDebt: number; unpaidBillsCount: number };
export type DirectoryStats = { total: number; admins: number; debtors: number; overpaid: number; noDebt: number; unknown: number; pending: number };
export function classifyBalance(balance: BalanceResult): UserFilter {
  return balance.totalDebt > 0.01 ? 'debtors' : balance.totalDebt < -0.01 ? 'overpaid' : 'no-debt';
}
