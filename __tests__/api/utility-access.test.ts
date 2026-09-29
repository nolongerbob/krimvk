/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { POST as adminPost, GET as adminGet } from '@/app/api/admin/utility-access/route';
import { POST as recover } from '@/app/api/accounts/password-recovery/route';
import { requireAdmin } from '@/lib/require-admin';
import { getAppSession } from '@/lib/get-app-session';
import { changeUtilityPassword } from '@/lib/utility-password-change';
import { requestUtilityPasswordRecovery } from '@/lib/utility-password-recovery';
import { cacheIncr } from '@/lib/cache/redis';
jest.mock('server-only', () => ({}));
jest.mock('@/lib/require-admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: {} }));
jest.mock('@/lib/utility-password-change', () => ({ changeUtilityPassword: jest.fn() }));
jest.mock('@/lib/utility-password-recovery', () => ({ requestUtilityPasswordRecovery: jest.fn() }));
jest.mock('@/lib/utility-account-email', () => ({ syncUtilityAccountEmail: jest.fn() }));
jest.mock('@/lib/cache/redis', () => ({ cacheIncr: jest.fn() }));
const base = { accountNumber: '123', region: 'saki' }, requestId = '53ca1ba9-a9fa-43ae-ae97-44cce94312d8';
const req = (body: unknown, origin = 'http://localhost:3006') => new NextRequest('http://localhost:3006/api/action', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => { jest.clearAllMocks(); (changeUtilityPassword as jest.Mock).mockResolvedValue({ success: true }); (requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: 'operator' } }); (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'self' } }); (cacheIncr as jest.Mock).mockResolvedValue(1); });
it('rejects unauthenticated and non-admin callers before touching credentials', async () => {
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 403 }) });
  expect((await adminPost(req({}))).status).toBe(403); expect((await adminGet()).status).toBe(403);
  (getAppSession as jest.Mock).mockResolvedValue(null); expect((await recover(req({}))).status).toBe(401);
  expect(changeUtilityPassword).not.toHaveBeenCalled();
});
it.each(['', 'https://attacker.test'])('rejects origin %s for admin and recovery', async origin => {
  expect((await adminPost(req({}, origin))).status).toBe(403); expect((await recover(req({}, origin))).status).toBe(403);
});
it('binds the recipient to the server-side chat and operator identity', async () => {
  const response = await adminPost(req({ ...base, requestId, questionId: 'chat', action: 'generate' }));
  expect(response.status).toBe(200);
  expect(changeUtilityPassword).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'operator', questionId: 'chat', accountNumber: '123' }));
  expect(response.headers.get('cache-control')).toBe('no-store');
});
it.each([{ region: 'krasn' }, { accountNumber: '../123' }, { userId: 'attacker' }, { email: 'attacker@example.test' }])('rejects forged admin input %#', async bad => {
  expect((await adminPost(req({ ...base, requestId, questionId: 'chat', action: 'generate', ...bad }))).status).toBe(400);
  expect(changeUtilityPassword).not.toHaveBeenCalled();
});
it('accepts safe reconciliation without sending another password', async () => {
  await adminPost(req({ ...base, requestId, questionId: 'chat', action: 'check' }));
  expect(changeUtilityPassword).toHaveBeenCalledWith(expect.objectContaining({ checkOnly: true, password: undefined }));
});
it('sends recovery only for the authenticated identity, rejects supplied email/unsupported region', async () => {
  await recover(req({ ...base, action: 'request' })); expect(requestUtilityPasswordRecovery).toHaveBeenCalledWith('self', '123', 'saki');
  expect((await recover(req({ ...base, action: 'request', email: 'attacker@example.test' }))).status).toBe(400);
  expect((await recover(req({ ...base, action: 'request', region: 'krasn' }))).status).toBe(400);
});
it('limits password and recovery abuse', async () => {
  (cacheIncr as jest.Mock).mockResolvedValue(99);
  expect((await recover(req({ ...base, action: 'request' }))).status).toBe(429);
  expect((await adminPost(req({ ...base, requestId, questionId: 'chat', action: 'generate' }))).status).toBe(429);
  expect(changeUtilityPassword).not.toHaveBeenCalled(); expect(requestUtilityPasswordRecovery).not.toHaveBeenCalled();
});
