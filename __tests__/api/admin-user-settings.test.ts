/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { PATCH, DELETE } from '@/app/api/admin/users/[id]/profile/route';
import { GET } from '@/app/api/admin/users/[id]/settings/route';
import { DELETE as unlink } from '@/app/api/admin/users/[id]/services/[linkId]/route';
import { requireAdmin } from '@/lib/require-admin';
import { rateLimit } from '@/lib/security/http-guard';
import { deleteAdminUser, updateAdminUserProfile, getAdminUserSettings, unlinkAdminUserService, AdminUserError } from '@/lib/admin-user-management';
jest.mock('@/lib/require-admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/security/http-guard', () => ({ rateLimit: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: {}, withRetry: jest.fn() }));
jest.mock('@/lib/admin-user-management', () => ({
  updateAdminUserProfile: jest.fn(), deleteAdminUser: jest.fn(), getAdminUserSettings: jest.fn(), unlinkAdminUserService: jest.fn(),
  AdminUserError: class extends Error { constructor(message: string, public status: number) { super(message); } },
}));
const params = { params: Promise.resolve({ id: 'client', linkId: 'provider-link' }) };
function request(method = 'PATCH', body: unknown = { name: 'New' }, origin = 'http://localhost:3006') {
  return new NextRequest('http://localhost:3006/api/admin/users/client/profile', { method, headers: { origin, 'content-type': 'application/json' }, ...(method !== 'GET' && { body: JSON.stringify(body) }) });
}
beforeEach(() => { jest.resetAllMocks(); (requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: 'admin' } }); (rateLimit as jest.Mock).mockReturnValue(true); });
it.each([PATCH, DELETE, unlink, GET])('rejects non-admins before accessing settings %#', async handler => {
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 403 }) });
  expect((await handler(request(), params)).status).toBe(403);
  expect(updateAdminUserProfile).not.toHaveBeenCalled(); expect(deleteAdminUser).not.toHaveBeenCalled(); expect(getAdminUserSettings).not.toHaveBeenCalled(); expect(unlinkAdminUserService).not.toHaveBeenCalled();
});
it.each([PATCH, DELETE, unlink])('blocks absent/foreign origins on writes %#', async handler => {
  expect((await handler(request('DELETE', {}, 'https://foreign.test'), params)).status).toBe(403);
  expect((await handler(request('DELETE', {}, ''), params)).status).toBe(403);
});
it('binds edits to the path identity and verified actor', async () => {
  (updateAdminUserProfile as jest.Mock).mockResolvedValue({ id: 'client', name: 'New' });
  const response = await PATCH(request(), params);
  expect(response.status).toBe(200);
  expect(updateAdminUserProfile).toHaveBeenCalledWith('admin', 'client', { name: 'New' });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
it('requires delete confirmation and passes only it and the route identity', async () => {
  expect((await DELETE(request('DELETE', {}), params)).status).toBe(400);
  expect(deleteAdminUser).not.toHaveBeenCalled();
  expect((await DELETE(request('DELETE', { confirmation: 'client@example.test', userId: 'other' }), params)).status).toBe(200);
  expect(deleteAdminUser).toHaveBeenCalledWith('admin', 'client', 'client@example.test');
});
it('passes provider unlink confirmation and path IDs', async () => {
  expect((await unlink(request('DELETE', { confirmation: 'yandex' }), params)).status).toBe(200);
  expect(unlinkAdminUserService).toHaveBeenCalledWith('admin', 'client', 'provider-link', 'yandex');
});
it('returns meaningful conflicts, not success for a blocked delete', async () => {
  (deleteAdminUser as jest.Mock).mockRejectedValue(new AdminUserError('Нельзя удалить свой аккаунт', 409));
  const response = await DELETE(request('DELETE', { confirmation: 'client@example.test' }), params);
  expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: 'Нельзя удалить свой аккаунт' });
});
it('limits repeated destructive requests', async () => {
  (rateLimit as jest.Mock).mockReturnValue(false);
  expect((await DELETE(request('DELETE', { confirmation: 'client@example.test' }), params)).status).toBe(429);
  expect(deleteAdminUser).not.toHaveBeenCalled();
});
it('loads settings privately without waiting for 1C', async () => {
  (getAdminUserSettings as jest.Mock).mockResolvedValue({ linkedServices: [] });
  const response = await GET(request('GET'), params);
  expect(await response.json()).toEqual({ settings: { linkedServices: [] } });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
