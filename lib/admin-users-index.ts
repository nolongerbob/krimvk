import { prisma, withRetry } from '@/lib/prisma';
import { loadAdminUserBalance } from '@/lib/admin-user-balance';
import { classifyBalance, type BalanceResult, type DirectoryStats } from '@/lib/admin-users-filters';

// Read-only, process-local snapshot. Shared by route and RSC bundles; never writes to the DB.
type Snapshot = { balances: Map<string, BalanceResult | null>; running: boolean; finishedAt: number; startedAt: number; error: boolean };
const scope = globalThis as typeof globalThis & { adminUsersSnapshot?: Snapshot };
const state = scope.adminUsersSnapshot ??= { balances: new Map(), running: false, finishedAt: 0, startedAt: 0, error: false };
const TTL = 5 * 60_000;

export function getBalanceSnapshot() { return state; }

export function ensureBalanceSnapshot(force = false) {
  if (state.running || (!force && !state.error && Date.now() - state.finishedAt < TTL)) return;
  state.running = true;
  state.error = false;
  state.startedAt = Date.now();
  state.balances = new Map();
  void (async () => {
    try {
      const users = await withRetry(() => prisma.user.findMany({ select: {
        id: true,
        userAccounts: { where: { isActive: true }, select: { accountNumber: true, password1c: true, region: true } },
        bills: { where: { status: { in: ['UNPAID', 'OVERDUE'] } }, select: { amount: true } },
      }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }));
      let index = 0;
      let nextRequestAt = 0;
      const worker = async () => {
        while (index < users.length) {
          const user = users[index++];
          const id = user.id;
          try {
            if (user.userAccounts.length) {
              const requestAt = Math.max(Date.now(), nextRequestAt);
              nextRequestAt = requestAt + 1000;
              await new Promise(resolve => setTimeout(resolve, requestAt - Date.now()));
            }
            const balance = await loadAdminUserBalance(id, user);
            state.balances.set(id, Number.isFinite(balance.totalDebt) && Number.isFinite(balance.unpaidBillsCount) ? balance : null);
          } catch { state.balances.set(id, null); }
        }
      };
      // Bound 1C and DB concurrency, regardless of the number of open admin tabs.
      await Promise.all([worker(), worker()]);
    } catch { state.error = true; }
    finally { state.running = false; state.finishedAt = Date.now(); }
  })();
}

export function directoryStats(users: { id: string; role: string }[]) {
  const stats: DirectoryStats = { total: users.length, admins: 0, debtors: 0, overpaid: 0, noDebt: 0, unknown: 0, pending: 0 };
  for (const user of users) {
    if (user.role === 'ADMIN') stats.admins++;
    const balance = state.balances.get(user.id);
    if (balance === undefined) stats.pending++;
    else if (balance === null) stats.unknown++;
    else {
      const filter = classifyBalance(balance);
      if (filter === 'no-debt') stats.noDebt++;
      else if (filter === 'debtors') stats.debtors++;
      else stats.overpaid++;
    }
  }
  return stats;
}
