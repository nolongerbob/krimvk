/** @jest-environment node */
// Explicit opt-in. Uses only the isolated localhost database and a loopback fake 1C.
import { createServer, Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { changeUtilityPassword } from '@/lib/utility-password-change';
import { requestUtilityPasswordRecovery } from '@/lib/utility-password-recovery';
import { sendUtilityPasswordRecovery } from '@/lib/resend';
import { encryptPassword1c, decryptPassword1c } from '@/lib/password1c-crypto';
import { linkAdminUserAccount } from '@/lib/admin-link-user-account';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/prisma', () => {
  if (process.env.UTILITY_LOCAL_DB_TEST !== '1') return { prisma: {} };
  const { readFileSync } = require('node:fs');
  const { PrismaClient } = require('@prisma/client');
  const cfg = JSON.parse(readFileSync('.local-dev/environment.json', 'utf8'));
  return { prisma: new PrismaClient({ datasources: { db: { url: `postgresql://krimvk_dev:${encodeURIComponent(cfg.databasePassword)}@127.0.0.1:55435/krimvk_dev` } } }) };
});
jest.mock('@/lib/1c-api', () => ({
  get1cBaseUrl: () => process.env.UTILITY_TEST_API_ORIGIN,
  get1CUserData: async (accountNumber: string, password: string, region: string) => {
    const url = new URL(`/${region}/hs/WebAccounts/get_data`, process.env.UTILITY_TEST_API_ORIGIN);
    url.searchParams.set('WaLsCode', accountNumber); url.searchParams.set('WaPass', password);
    const response = await fetch(url);
    if (!response.ok) throw new Error('AUTH_ERROR');
    return response.json();
  },
}));
jest.mock('@/lib/admin-users-index', () => ({ invalidateUserBalance: jest.fn() }));
jest.mock('@/lib/resend', () => ({ sendUtilityPasswordRecovery: jest.fn() }));

const suite = process.env.UTILITY_LOCAL_DB_TEST === '1' ? describe : describe.skip;
suite('local database + fake 1C credential workflow', () => {
  const suffix = randomUUID(), accountNumber = `9900${Date.now()}`;
  const operatorId = `utility-qa-admin-${suffix}`, userId = `utility-qa-user-${suffix}`;
  const ids: string[] = [];
  let questionId: string, server: Server, currentPassword = 'Before123', resetCount = 0, email = '';
  beforeAll(async () => {
    process.env.PASSWORD1C_ENCRYPTION_KEY = 'utility-local-integration-only'; process.env.ONE_C_READ_ONLY = 'false';
    server = createServer((req, res) => {
      const url = new URL(req.url!, 'http://127.0.0.1');
      if (!url.pathname.startsWith('/saki/hs/WebAccounts/') || url.searchParams.get('WaLsCode') !== accountNumber) { res.writeHead(404); res.end('{}'); return; }
      const method = url.pathname.split('/').pop();
      if (method === 'get_data') {
        if (url.searchParams.get('WaPass') !== currentPassword) { res.writeHead(401); res.end('{}'); return; }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ LSCode: accountNumber, Address: 'Local test only', MeteringDevices: [{ Number: 'QA-meter', LastReading: '10,5' }] })); return;
      }
      if (method === 'ResetAccountPassword') {
        resetCount++; currentPassword = url.searchParams.get('WaNewPass')!;
        // Simulate a write applied by 1C but an unsuccessful HTTP acknowledgement.
        res.writeHead(503); res.end('{}'); return;
      }
      if (method === 'UpdateAccountEmail') email = url.searchParams.get('WaNewEMail')!;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(method === 'GetAccountPassword' ? { WaLsPass: currentPassword } : { success: true }));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as { port: number };
    process.env.UTILITY_TEST_API_ORIGIN = `http://127.0.0.1:${address.port}`;
    await prisma.user.create({ data: { id: operatorId, email: `${operatorId}@example.test`, name: 'Utility QA operator', role: 'ADMIN' } });
    await prisma.user.create({ data: { id: userId, email: `${userId}@example.test`, name: 'Utility QA recipient', emailVerified: new Date() } });
    const question = await prisma.question.create({ data: { userId, status: 'PENDING', messages: { create: { text: 'Disposable local utility workflow test', isFromAdmin: false } } } });
    questionId = question.id;
    await prisma.userAccount.create({ data: { userId, accountNumber, region: 'saki', address: 'Local test only', password1c: encryptPassword1c(currentPassword) } });
  });
  afterAll(async () => {
    // Delete only synthetic records created by this test; no existing users/accounts touched.
    await prisma.verificationToken.deleteMany({ where: { identifier: { startsWith: `utility-recovery:${userId}:` } } });
    await prisma.utilityPasswordChange.deleteMany({ where: { id: { in: ids }, userId } });
    await prisma.utilityAccountAccess.deleteMany({ where: { key: `saki:${accountNumber}` } });
    await prisma.user.deleteMany({ where: { id: { in: [operatorId, userId] } } });
    await prisma.$disconnect();
    if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    delete process.env.UTILITY_TEST_API_ORIGIN; delete process.env.ONE_C_READ_ONLY; delete process.env.PASSWORD1C_ENCRYPTION_KEY;
  });
  it('changes a password once, persists the encrypted credential and delivers a sensitive chat message', async () => {
    const requestId = randomUUID(); ids.push(requestId);
    const input = { actorId: operatorId, questionId, accountNumber, region: 'saki', requestId };
    const result = await changeUtilityPassword(input);
    expect(result.message?.isSensitive).toBe(true); expect(result.message?.questionId).toBe(questionId);
    expect(currentPassword).toHaveLength(8); expect(resetCount).toBe(1);
    const linked = await prisma.userAccount.findUniqueOrThrow({ where: { accountNumber } });
    expect(decryptPassword1c(linked.password1c)).toBe(currentPassword);
    expect(email).toBe(`${userId}@example.test`);
    expect((await changeUtilityPassword({ ...input, checkOnly: true })).message?.id).toBe(result.message?.id);
    expect(resetCount).toBe(1);
  });
  it('restores an unlinked account through the verified LK email without exposing the old password', async () => {
    await prisma.userAccount.deleteMany({ where: { userId, accountNumber } });
    await requestUtilityPasswordRecovery(userId, accountNumber, 'saki');
    const [recipient, token] = (sendUtilityPasswordRecovery as jest.Mock).mock.calls[0];
    expect(recipient).toBe(`${userId}@example.test`);
    const requestId = randomUUID(); ids.push(requestId);
    const result = await changeUtilityPassword({ actorId: userId, accountNumber, region: 'saki', requestId, token, password: 'After123' });
    expect(result.message).toBeNull(); expect(currentPassword).toBe('After123'); expect(resetCount).toBe(2);
    const replayId = randomUUID(); ids.push(replayId);
    await expect(changeUtilityPassword({ actorId: userId, accountNumber, region: 'saki', requestId: replayId, token, password: 'Replay12' })).rejects.toThrow();
    expect(resetCount).toBe(2);
  });
  it('lets the operator link the recovered account to the recipient, with meters and no password reset', async () => {
    const result = await linkAdminUserAccount(operatorId, userId, { accountNumber, password1c: currentPassword, region: 'saki' });
    const linked = await prisma.userAccount.findUniqueOrThrow({ where: { accountNumber }, include: { meters: true } });
    expect(linked.userId).toBe(userId); expect(linked.meters[0].userId).toBe(userId);
    expect(linked.meters[0].lastReading).toBe(10.5); expect(decryptPassword1c(linked.password1c)).toBe(currentPassword);
    expect(result.account).not.toHaveProperty('password1c'); expect(result.emailSyncPending).toBe(false);
    expect(resetCount).toBe(2);
    await expect(linkAdminUserAccount(operatorId, userId, { accountNumber, password1c: currentPassword, region: 'saki' })).rejects.toMatchObject({ status: 409 });
    expect(await prisma.userAccount.count({ where: { userId, accountNumber } })).toBe(1);
  });
});
