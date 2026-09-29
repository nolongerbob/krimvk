/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { DELETE as selfDelete } from '@/app/api/accounts/[id]/route';
import { DELETE as adminDelete } from '@/app/api/admin/users/[id]/accounts/[accountId]/route';
import { getAppSession } from '@/lib/get-app-session';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { invalidateUserBalance } from '@/lib/admin-users-index';
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/require-admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/admin-users-index', () => ({ invalidateUserBalance: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { userAccount: { deleteMany: jest.fn() } } }));
const request = (origin = 'http://localhost:3006') => new NextRequest('http://localhost:3006/api/accounts/account-1', { method: 'DELETE', headers: { origin } });
const params = { params: Promise.resolve({ id: 'account-1' }) };
beforeEach(() => {
  jest.clearAllMocks();
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'owner' } });
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: 'admin' } });
  (prisma.userAccount.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
});
it('rejects anonymous users', async () => {
  (getAppSession as jest.Mock).mockResolvedValue(null);
  expect((await selfDelete(request(), params)).status).toBe(401);
  expect(prisma.userAccount.deleteMany).not.toHaveBeenCalled();
});
it('rejects cross-origin mutations', async () => {
  expect((await selfDelete(request('https://evil.example'), params)).status).toBe(403);
  expect((await adminDelete(request('https://evil.example'), { params: Promise.resolve({ id: 'owner', accountId: 'account-1' }) })).status).toBe(403);
  expect(prisma.userAccount.deleteMany).not.toHaveBeenCalled();
});
it('deletes only a binding owned by the authenticated user', async () => {
  expect((await selfDelete(request(), params)).status).toBe(200);
  expect(prisma.userAccount.deleteMany).toHaveBeenCalledWith({ where: { id: 'account-1', userId: 'owner' } });
  expect(invalidateUserBalance).toHaveBeenCalledWith('owner');
});
it('handles a foreign binding or repeated unlink as not found', async () => {
  (prisma.userAccount.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
  expect((await selfDelete(request(), params)).status).toBe(404);
  expect(invalidateUserBalance).not.toHaveBeenCalled();
});
it('requires administrator authorization', async () => {
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 403 }) });
  expect((await adminDelete(request(), { params: Promise.resolve({ id: 'owner', accountId: 'account-1' }) })).status).toBe(403);
  expect(prisma.userAccount.deleteMany).not.toHaveBeenCalled();
});
it('admin deletion is scoped to the selected person and account', async () => {
  expect((await adminDelete(request(), { params: Promise.resolve({ id: 'person', accountId: 'account-1' }) })).status).toBe(200);
  expect(prisma.userAccount.deleteMany).toHaveBeenCalledWith({ where: { id: 'account-1', userId: 'person' } });
});
it('returns a safe error on database failure', async () => {
  (prisma.userAccount.deleteMany as jest.Mock).mockRejectedValue(new Error('private database error'));
  const response = await selfDelete(request(), params);
  expect(response.status).toBe(500);
  expect(JSON.stringify(await response.json())).not.toContain('private database');
});
