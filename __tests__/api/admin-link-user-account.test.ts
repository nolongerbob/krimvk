/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/users/[id]/accounts/route';
import { requireAdmin } from '@/lib/require-admin';
import { rateLimit } from '@/lib/security/http-guard';
import { linkAdminUserAccount } from '@/lib/admin-link-user-account';
import { AdminUserError } from '@/lib/admin-user-management';
jest.mock('@/lib/require-admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/security/http-guard', () => ({ rateLimit: jest.fn() }));
jest.mock('@/lib/admin-link-user-account', () => ({ linkAdminUserAccount: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: {} }));
jest.mock('@/lib/admin-users-index', () => ({ invalidateUserBalance: jest.fn() }));
jest.mock('@/lib/cache/redis', () => ({}));
const input = { accountNumber: '123', region: 'saki', password1c: 'private' };
const params = { params: Promise.resolve({ id: 'client' }) };
const request = (origin = 'http://localhost:3006', body = JSON.stringify(input)) => new NextRequest('http://localhost:3006/api/admin/users/client/accounts', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body });
beforeEach(() => { jest.resetAllMocks(); (requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: 'admin' } }); (rateLimit as jest.Mock).mockReturnValue(true); });
it('binds the target to the route and the operator to authenticated identity', async () => {
  (linkAdminUserAccount as jest.Mock).mockResolvedValue({ account: { id: 'account' }, emailSyncPending: false });
  const response = await POST(request(), params);
  expect(response.status).toBe(201); expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(linkAdminUserAccount).toHaveBeenCalledWith('admin', 'client', input);
  expect(await response.json()).toEqual({ success: true, account: { id: 'account' }, emailSyncPending: false });
});
it.each([401, 403])('blocks unauthorized requests (%s)', async status => {
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({}, { status }) });
  expect((await POST(request(), params)).status).toBe(status); expect(linkAdminUserAccount).not.toHaveBeenCalled();
});
it.each(['', 'https://foreign.example'])('rejects invalid origins %s', async origin => {
  expect((await POST(request(origin), params)).status).toBe(403); expect(linkAdminUserAccount).not.toHaveBeenCalled();
});
it('rate limits repeated account/password attempts', async () => {
  (rateLimit as jest.Mock).mockReturnValue(false);
  expect((await POST(request(), params)).status).toBe(429); expect(linkAdminUserAccount).not.toHaveBeenCalled();
});
it('returns validation errors and hides unexpected database errors', async () => {
  (linkAdminUserAccount as jest.Mock).mockRejectedValueOnce(new AdminUserError('Некорректные данные', 400));
  expect((await POST(request(undefined, '{broken'), params)).status).toBe(400);
  expect(linkAdminUserAccount).toHaveBeenCalledWith('admin', 'client', null);
  (linkAdminUserAccount as jest.Mock).mockRejectedValueOnce(new Error('password1c private-value'));
  const response = await POST(request(), params);
  expect(response.status).toBe(500); expect(await response.text()).not.toContain('private-value');
});
