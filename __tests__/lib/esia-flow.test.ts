/** @jest-environment node */
import { getEsiaPreparation } from '@/lib/esia-config';
import { createEsiaFlow, consumeEsiaFlow } from '@/lib/esia-flow';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/auth/esia-start/route';
import { GET } from '@/app/api/auth/callback/esia/route';
jest.mock('@/lib/prisma', () => ({ prisma: { verificationToken: { create: jest.fn(), deleteMany: jest.fn() } } }));
const originalEnv = process.env;
beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv, NODE_ENV: 'development', NEXTAUTH_URL: 'https://dev.example.test', NEXTAUTH_SECRET: 'a'.repeat(64),
    ESIA_ENVIRONMENT: 'test', ESIA_CLIENT_ID: 'TEST_SYSTEM', ESIA_REDIRECT_URI: 'https://dev.example.test/api/auth/callback/esia', ESIA_CERTIFICATE_THUMBPRINT: 'test-reference' };
  (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});
  (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
});
afterEach(() => { process.env = originalEnv; });
it('never enables actual auth, even with every configuration field present', () => {
  expect(getEsiaPreparation()).toMatchObject({ enabled: false, configurationReady: true });
  expect(getEsiaPreparation({ ...process.env, NODE_ENV: 'production' }).configurationReady).toBe(false);
  expect(getEsiaPreparation({ ...process.env, ESIA_ENVIRONMENT: 'production' }).configurationReady).toBe(false);
});
it.each(['http://dev.example.test/api/auth/callback/esia', 'https://evil.test/api/auth/callback/esia', 'https://dev.example.test/api/auth/callback/esia?next=evil', 'https://user:secret@dev.example.test/api/auth/callback/esia'])(
  'rejects unsafe callback %s', url => { expect(getEsiaPreparation({ ...process.env, ESIA_REDIRECT_URI: url }).configurationReady).toBe(false); });
it('creates an encrypted cookie and stores only hashed state with expiry', async () => {
  const flow = await createEsiaFlow({ mode: 'register' });
  expect(flow.cookie).not.toContain(flow.state);
  const data = (prisma.verificationToken.create as jest.Mock).mock.calls[0][0].data;
  expect(data.identifier).toBe('esia-flow:test');
  expect(data.token).toHaveLength(64);
  expect(data.token).not.toBe(flow.state);
  expect(await consumeEsiaFlow(flow.cookie, flow.state)).toEqual({ mode: 'register' });
});
it('rejects tampered cookies and mismatched state before DB consumption', async () => {
  const flow = await createEsiaFlow({ mode: 'login' });
  expect(await consumeEsiaFlow(flow.cookie + 'broken', flow.state)).toBeNull();
  expect(await consumeEsiaFlow(flow.cookie, '11111111-1111-4111-8111-111111111111')).toBeNull();
  expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled();
});
it('binds linking to the original authenticated user', async () => {
  const flow = await createEsiaFlow({ mode: 'link', userId: 'owner' });
  expect(await consumeEsiaFlow(flow.cookie, flow.state, 'other')).toBeNull();
  expect(await consumeEsiaFlow(flow.cookie, flow.state)).toBeNull();
  expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled();
  expect(await consumeEsiaFlow(flow.cookie, flow.state, 'owner')).toEqual({ mode: 'link', userId: 'owner' });
});
it('rejects reused or expired state', async () => {
  const flow = await createEsiaFlow({ mode: 'login' });
  (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
  expect(await consumeEsiaFlow(flow.cookie, flow.state)).toBeNull();
  expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ expires: { gt: expect.any(Date) } }) }));
});
it('does not switch an existing login', async () => {
  const flow = await createEsiaFlow({ mode: 'login' });
  expect(await consumeEsiaFlow(flow.cookie, flow.state, 'signed-in')).toBeNull();
  expect(prisma.verificationToken.deleteMany).not.toHaveBeenCalled();
});
it('public start and callback remain closed without creating auth cookies or DB writes', async () => {
  const start = await POST();
  const callback = await GET();
  expect(start.status).toBe(503);
  expect(callback.status).toBe(503);
  expect(start.headers.get('set-cookie')).toBeNull();
  expect(callback.headers.get('set-cookie')).not.toContain('next-auth.session-token');
  expect(prisma.verificationToken.create).not.toHaveBeenCalled();
});
