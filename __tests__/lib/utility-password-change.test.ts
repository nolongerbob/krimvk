/** @jest-environment node */
import { prisma } from '@/lib/prisma';
import { changeUtilityPassword, generateUtilityPassword } from '@/lib/utility-password-change';
import { reset1CAccountPassword, get1CAccountPassword } from '@/lib/1c-account-access';
import { decryptPassword1c } from '@/lib/password1c-crypto';
import { recoveryHash, recoveryPrefix } from '@/lib/utility-password-recovery';
jest.mock('server-only', () => ({}));
jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn(), message: { findUnique: jest.fn() } } }));
jest.mock('@/lib/1c-account-access', () => ({ assertUtilityWritesEnabled: jest.fn(), reset1CAccountPassword: jest.fn(), get1CAccountPassword: jest.fn(), samePassword: (a: string, b: string) => a === b }));
jest.mock('@/lib/admin-users-index', () => ({ invalidateUserBalance: jest.fn() }));
jest.mock('@/lib/utility-account-email', () => ({ syncUtilityAccountEmail: jest.fn(async () => 'synced') }));
jest.mock('@/lib/resend', () => ({ sendUtilityPasswordRecovery: jest.fn() }));
const tx = { $queryRaw: jest.fn(), user: { findUnique: jest.fn() }, userAccount: { findFirst: jest.fn(), updateMany: jest.fn() }, question: { findUnique: jest.fn(), update: jest.fn() },
  utilityAccountAccess: { upsert: jest.fn(), update: jest.fn() }, utilityPasswordChange: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), create: jest.fn(), update: jest.fn() },
  verificationToken: { findUnique: jest.fn(), deleteMany: jest.fn() }, message: { create: jest.fn() },
};
const input = { requestId: 'operation', actorId: 'admin', questionId: 'chat', region: 'saki', accountNumber: '00123' };
let operation: any, access: any;
beforeEach(() => {
  jest.clearAllMocks(); operation = null; access = { key: 'saki:00123', userId: 'client', email: 'client@example.test', emailSyncedAt: new Date(), pendingChangeId: null };
  process.env.PASSWORD1C_ENCRYPTION_KEY = 'unit-test-key';
  (prisma.$transaction as jest.Mock).mockImplementation(fn => fn(tx));
  tx.user.findUnique.mockImplementation(async ({ where }) => where.id === 'admin' ? { role: 'ADMIN' } : { id: 'client', email: 'client@example.test', emailVerified: new Date() });
  tx.userAccount.findFirst.mockResolvedValue({ userId: 'client', region: 'saki' });
  tx.question.findUnique.mockResolvedValue({ userId: 'client', status: 'PENDING' });
  tx.utilityAccountAccess.upsert.mockImplementation(async () => access);
  tx.utilityAccountAccess.update.mockImplementation(async ({ data }) => Object.assign(access, data));
  tx.utilityPasswordChange.findUnique.mockImplementation(async () => operation);
  tx.utilityPasswordChange.findUniqueOrThrow.mockImplementation(async () => operation);
  tx.utilityPasswordChange.create.mockImplementation(async ({ data }) => operation = { ...data, status: 'PENDING' });
  tx.utilityPasswordChange.update.mockImplementation(async ({ data }) => operation = { ...operation, ...data });
  tx.message.create.mockImplementation(async ({ data }) => ({ ...data, id: 'sent' }));
  (prisma.message.findUnique as jest.Mock).mockResolvedValue({ id: 'sent' });
  (reset1CAccountPassword as jest.Mock).mockResolvedValue({});
  (get1CAccountPassword as jest.Mock).mockImplementation(async () => decryptPassword1c(operation.passwordEncrypted));
  tx.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
  jest.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => { delete process.env.PASSWORD1C_ENCRYPTION_KEY; });
it('generates exactly 8 random unambiguous alphanumeric characters of every class', () => {
  const passwords = new Set(Array.from({ length: 100 }, generateUtilityPassword));
  expect(passwords.size).toBe(100);
  for (const p of Array.from(passwords)) { expect(p).toMatch(/^[A-HJ-NP-Za-km-z2-9]{8}$/); expect(p).toMatch(/[A-Z]/); expect(p).toMatch(/[a-z]/); expect(p).toMatch(/[2-9]/); }
});
it('resets, verifies, stores the local encrypted credential and sends only to the selected chat', async () => {
  const result = await changeUtilityPassword({ ...input, password: 'Abcd1234' });
  expect(reset1CAccountPassword).toHaveBeenCalledWith('00123', 'Abcd1234', 'saki');
  expect(get1CAccountPassword).toHaveBeenCalledWith('00123', 'saki');
  const stored = tx.userAccount.updateMany.mock.calls[0][0];
  expect(stored.where).toEqual({ accountNumber: '00123', region: 'saki', userId: 'client' });
  expect(stored.data.password1c).toMatch(/^enc1:/);
  expect(tx.message.create).toHaveBeenCalledWith({ data: expect.objectContaining({ questionId: 'chat', isSensitive: true, isFromAdmin: true, authorId: 'admin', text: expect.stringContaining('Abcd1234') }) });
  expect(operation.passwordEncrypted).toBe(''); expect(access.pendingChangeId).toBeNull(); expect(result.success).toBe(true);
});
it('retries the same request without a second reset or duplicated message', async () => {
  await changeUtilityPassword(input); await changeUtilityPassword(input);
  expect(reset1CAccountPassword).toHaveBeenCalledTimes(1); expect(tx.message.create).toHaveBeenCalledTimes(1);
});
it('handles lost write responses via a password readback, not another reset', async () => {
  (reset1CAccountPassword as jest.Mock).mockRejectedValue(new Error('timeout'));
  expect((await changeUtilityPassword(input)).success).toBe(true);
  expect(reset1CAccountPassword).toHaveBeenCalledTimes(1);
});
it('retains unknown operations, never sends an unconfirmed password and reconciles safely', async () => {
  (get1CAccountPassword as jest.Mock).mockResolvedValueOnce('old-password');
  await expect(changeUtilityPassword(input)).rejects.toMatchObject({ code: 'ONE_C_RESULT_UNKNOWN' });
  expect(tx.message.create).not.toHaveBeenCalled(); expect(tx.userAccount.updateMany).not.toHaveBeenCalled();
  expect(access.pendingChangeId).toBe('operation');
  await changeUtilityPassword({ ...input, checkOnly: true });
  expect(reset1CAccountPassword).toHaveBeenCalledTimes(1); expect(tx.message.create).toHaveBeenCalledTimes(1);
});
it('does not start an operation from a check-only request', async () => {
  await expect(changeUtilityPassword({ ...input, checkOnly: true })).rejects.toMatchObject({ code: 'OPERATION_NOT_FOUND' });
  expect(reset1CAccountPassword).not.toHaveBeenCalled();
});
it.each(['wrong-owner', 'wrong-region', 'not-admin', 'closed-chat', 'pending-operation'])('blocks unsafe %s before contacting 1C', async mode => {
  if (mode === 'wrong-owner') tx.userAccount.findFirst.mockResolvedValue({ userId: 'other', region: 'saki' });
  if (mode === 'wrong-region') tx.userAccount.findFirst.mockResolvedValue({ userId: 'client', region: 'krasn' });
  if (mode === 'not-admin') tx.user.findUnique.mockResolvedValue({ role: 'USER' });
  if (mode === 'closed-chat') tx.question.findUnique.mockResolvedValue({ userId: 'client', status: 'COMPLETED' });
  if (mode === 'pending-operation') access.pendingChangeId = 'another-operation';
  await expect(changeUtilityPassword(input)).rejects.toThrow(); expect(reset1CAccountPassword).not.toHaveBeenCalled();
});
it('allows an operator-confirmed, previously unlinked account in the current chat', async () => {
  tx.userAccount.findFirst.mockResolvedValue(null);
  await changeUtilityPassword(input);
  expect(tx.message.create).toHaveBeenCalledTimes(1);
});
const token = 'a'.repeat(64);
const recoveryInput = { requestId: 'recovery', actorId: 'client', region: 'saki', accountNumber: '00123', token, password: 'Abcd1234' };
function pendingRecovery() { return { identifier: recoveryPrefix('client') + JSON.stringify({ accountNumber: '00123', region: 'saki', email: 'client@example.test' }), expires: new Date(Date.now() + 10000) }; }
it('consumes a valid one-use recovery link and changes only the utility password, not the site password', async () => {
  tx.verificationToken.findUnique.mockResolvedValue(pendingRecovery());
  await changeUtilityPassword(recoveryInput);
  expect(tx.verificationToken.findUnique).toHaveBeenCalledWith({ where: { token: recoveryHash(token) } });
  expect(tx.message.create).not.toHaveBeenCalled(); expect(tx.userAccount.updateMany).toHaveBeenCalled();
});
it.each(['missing', 'expired', 'wrong-account', 'new-email', 'unverified', 'already-claimed'])('rejects %s recovery before 1C', async kind => {
  tx.verificationToken.findUnique.mockResolvedValue(pendingRecovery());
  if (kind === 'missing') tx.verificationToken.findUnique.mockResolvedValue(null);
  if (kind === 'expired') tx.verificationToken.findUnique.mockResolvedValue({ ...pendingRecovery(), expires: new Date(0) });
  if (kind === 'wrong-account') tx.verificationToken.findUnique.mockResolvedValue({ ...pendingRecovery(), identifier: 'utility-recovery:other:{}' });
  if (kind === 'new-email') access.email = 'changed@example.test';
  if (kind === 'unverified') tx.user.findUnique.mockResolvedValue({ id: 'client', email: 'client@example.test', emailVerified: null });
  if (kind === 'already-claimed') tx.verificationToken.deleteMany.mockResolvedValue({ count: 0 });
  await expect(changeUtilityPassword(recoveryInput)).rejects.toThrow(); expect(reset1CAccountPassword).not.toHaveBeenCalled();
});
