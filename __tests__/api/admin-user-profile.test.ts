/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/admin/users/[id]/profile/route';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/require-admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } }, withRetry: (fn: () => unknown) => fn() }));
const request = () => new NextRequest('https://example.test/api/admin/users/client/profile');
const params = { params: Promise.resolve({ id: 'client' }) };
beforeEach(() => { jest.clearAllMocks(); (requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: 'admin' } }); });
it('rejects non-admins before accessing customer data', async () => {
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 403 }) });
  expect((await GET(request(), params)).status).toBe(403);
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
});
it('returns 404 for a deleted customer', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  expect((await GET(request(), params)).status).toBe(404);
});
it('returns the directory profile without credentials or waiting for 1C', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'client', name: 'Client', email: 'client@example.test', phone: null, address: null, role: 'USER', createdAt: new Date(), _count: { applications: 30 }, userAccounts: [], applications: [], bills: [], password: 'must-not-leak' });
  const response = await GET(request(), params);
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  const { user } = await response.json();
  expect(user.id).toBe('client');
  expect(user.password).toBeUndefined();
  expect(user.balanceLoading).toBe(true);
  const select = (prisma.user.findUnique as jest.Mock).mock.calls[0][0].select;
  expect(select.password).toBeUndefined();
  expect(select.userAccounts.select.password1c).toBeUndefined();
});
