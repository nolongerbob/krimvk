/** @jest-environment node */
jest.mock('@/lib/prisma', () => ({ prisma: { user: { findMany: jest.fn() } }, withRetry: (fn: () => unknown) => fn() }));
jest.mock('@/lib/admin-user-balance', () => ({ loadAdminUserBalance: jest.fn() }));
jest.mock('@/lib/require-admin', () => ({ requireAdmin: jest.fn() }));
import { prisma } from '@/lib/prisma';
import { loadAdminUserBalance } from '@/lib/admin-user-balance';
import { directoryStats, ensureBalanceSnapshot, getBalanceSnapshot } from '@/lib/admin-users-index';
import { GET } from '@/app/api/admin/users/balance-index/route';
import { requireAdmin } from '@/lib/require-admin';
import { NextRequest, NextResponse } from 'next/server';

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(getBalanceSnapshot(), { balances: new Map(), running: false, finishedAt: 0, error: false });
});

it('counts all users, never treating pending or failed balances as debt-free', () => {
  const users = Array.from({ length: 875 }, (_, i) => ({ id: String(i), role: i < 5 ? 'ADMIN' : 'USER' }));
  const state = getBalanceSnapshot();
  state.balances.set('800', { totalDebt: 10, unpaidBillsCount: 1 });
  state.balances.set('801', { totalDebt: -10, unpaidBillsCount: 0 });
  state.balances.set('802', { totalDebt: 0, unpaidBillsCount: 0 });
  state.balances.set('803', null);
  expect(directoryStats(users)).toEqual({ total: 875, admins: 5, debtors: 1, overpaid: 1, noDebt: 1, unknown: 1, pending: 871 });
});

it('shares one bounded scan across tabs, keeps failures unknown and reuses its snapshot', async () => {
  (prisma.user.findMany as jest.Mock).mockResolvedValue(Array.from({ length: 60 }, (_, i) => ({ id: String(i), userAccounts: [], bills: [] })));
  let active = 0;
  let peak = 0;
  (loadAdminUserBalance as jest.Mock).mockImplementation(async (id) => {
    active++; peak = Math.max(peak, active);
    await Promise.resolve();
    active--;
    if (id === '40') throw new Error('1C unavailable');
    return { totalDebt: 10, unpaidBillsCount: 1 };
  });
  ensureBalanceSnapshot(); ensureBalanceSnapshot();
  for (let i = 0; i < 200 && getBalanceSnapshot().running; i++) await new Promise(resolve => setImmediate(resolve));
  expect(getBalanceSnapshot().running).toBe(false);
  expect(getBalanceSnapshot().balances.size).toBe(60);
  expect(getBalanceSnapshot().balances.get('40')).toBeNull();
  expect(peak).toBeLessThanOrEqual(2);
  ensureBalanceSnapshot();
  expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
});

it('rejects unauthenticated requests before querying the directory or starting 1C work', async () => {
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 403 }) });
  expect((await GET(new NextRequest('https://example.test/api/admin/users/balance-index'))).status).toBe(403);
  expect(prisma.user.findMany).not.toHaveBeenCalled();
  expect(loadAdminUserBalance).not.toHaveBeenCalled();
});

it('refreshes a fresh snapshot when a newly registered user is missing', async () => {
  Object.assign(getBalanceSnapshot(), { finishedAt: Date.now(), startedAt: 0 });
  getBalanceSnapshot().balances.set('old', { totalDebt: 0, unpaidBillsCount: 0 });
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: 'admin' } });
  (prisma.user.findMany as jest.Mock)
    .mockResolvedValueOnce([{ id: 'old', role: 'USER' }, { id: 'new', role: 'USER' }])
    .mockResolvedValueOnce([{ id: 'old', userAccounts: [], bills: [] }, { id: 'new', userAccounts: [], bills: [] }]);
  (loadAdminUserBalance as jest.Mock).mockResolvedValue({ totalDebt: 0, unpaidBillsCount: 0 });
  const response = await GET(new NextRequest('https://example.test/api/admin/users/balance-index'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(getBalanceSnapshot().startedAt).toBeGreaterThan(0);
  for (let i = 0; i < 10 && getBalanceSnapshot().running; i++) await new Promise(resolve => setImmediate(resolve));
  expect(getBalanceSnapshot().balances.has('new')).toBe(true);
});
