/** @jest-environment node */
import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/user/account/route';
import { getAppSession } from '@/lib/get-app-session';
import { deleteOwnAccount } from '@/lib/delete-own-account';
import { rateLimit } from '@/lib/security/http-guard';
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/delete-own-account', () => ({ deleteOwnAccount: jest.fn(), AccountDeletionError: class extends Error {} }));
jest.mock('@/lib/security/http-guard', () => ({ rateLimit: jest.fn() }));
const request = (body: unknown = { password: 'secret', confirmation: 'УДАЛИТЬ', userId: 'victim' }, origin = 'http://localhost:3006') => new NextRequest('http://localhost:3006/api/user/account', {
  method: 'DELETE', headers: { origin, 'content-type': 'application/json', cookie: 'next-auth.session-token.0=old; next-auth.session-token.1=old2' }, body: JSON.stringify(body),
});
beforeEach(() => { jest.clearAllMocks(); (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'owner' } }); (rateLimit as jest.Mock).mockReturnValue(true); });
it('ignores body identity, deletes self and expires chunked cookies', async () => {
  const response = await DELETE(request());
  expect(response.status).toBe(200);
  expect(deleteOwnAccount).toHaveBeenCalledWith('owner', 'secret');
  expect(response.headers.get('set-cookie')).toContain('next-auth.session-token.0=;');
  expect(response.headers.get('set-cookie')).toContain('next-auth.session-token.1=;');
});
it('blocks cross-origin requests', async () => {
  expect((await DELETE(request({}, 'https://evil.example'))).status).toBe(403);
  expect(deleteOwnAccount).not.toHaveBeenCalled();
});
it('requires authentication', async () => {
  (getAppSession as jest.Mock).mockResolvedValue(null);
  expect((await DELETE(request())).status).toBe(401);
});
it('requires explicit confirmation', async () => {
  expect((await DELETE(request({ password: 'secret' }))).status).toBe(400);
  expect(deleteOwnAccount).not.toHaveBeenCalled();
});
it('limits password guesses', async () => {
  (rateLimit as jest.Mock).mockReturnValue(false);
  expect((await DELETE(request())).status).toBe(429);
  expect(deleteOwnAccount).not.toHaveBeenCalled();
});
