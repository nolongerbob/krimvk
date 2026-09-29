/** @jest-environment node */
import { prisma } from '@/lib/prisma';
import { requestUtilityPasswordRecovery, RECOVERY_MESSAGE, recoveryHash } from '@/lib/utility-password-recovery';
import { syncUtilityAccountEmail } from '@/lib/utility-account-email';
import { sendUtilityPasswordRecovery } from '@/lib/resend';
import { update1CAccountEmail } from '@/lib/1c-account-access';
jest.mock('server-only', () => ({}));
jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn(), verificationToken: { deleteMany: jest.fn() } } }));
jest.mock('@/lib/resend', () => ({ sendUtilityPasswordRecovery: jest.fn() }));
jest.mock('@/lib/1c-account-access', () => ({ assertUtilityWritesEnabled: jest.fn(), update1CAccountEmail: jest.fn() }));
const tx = { $queryRaw: jest.fn(), user: { findUnique: jest.fn() }, utilityAccountAccess: { findUnique: jest.fn(), upsert: jest.fn() }, userAccount: { findFirst: jest.fn() },
  verificationToken: { findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() }, utilityPasswordChange: { findFirst: jest.fn() } };
let user: any, access: any;
beforeEach(() => {
  jest.resetAllMocks();
  user = { email: 'user@example.test', emailVerified: new Date() };
  access = { userId: 'self', email: user.email, emailSyncedAt: new Date() };
  (prisma.$transaction as jest.Mock).mockImplementation(fn => fn(tx));
  tx.user.findUnique.mockImplementation(async () => user);
  tx.utilityAccountAccess.findUnique.mockImplementation(async () => access);
  tx.userAccount.findFirst.mockResolvedValue({ userId: 'self' });
});
it('sends to the verified profile mailbox, never a request-supplied address, storing only a hashed token', async () => {
  expect(await requestUtilityPasswordRecovery('self', '00123', 'saki')).toBe(RECOVERY_MESSAGE);
  const [email, token, account] = (sendUtilityPasswordRecovery as jest.Mock).mock.calls[0];
  expect(email).toBe('user@example.test'); expect(account).toBe('00123'); expect(token).toMatch(/^[a-f0-9]{64}$/);
  expect(tx.verificationToken.create).toHaveBeenCalledWith({ data: expect.objectContaining({ token: recoveryHash(token), identifier: expect.stringContaining('utility-recovery:self:') }) });
});
it.each(['unknown-account', 'other-user', 'unverified', 'different-email', 'not-synced', 'rate-limit', 'linked-elsewhere'])('uses a generic response and sends nothing for %s', async kind => {
  if (kind === 'unknown-account') access = null;
  if (kind === 'other-user') access.userId = 'other';
  if (kind === 'unverified') user.emailVerified = null;
  if (kind === 'different-email') user.email = 'new@example.test';
  if (kind === 'not-synced') access.emailSyncedAt = null;
  if (kind === 'rate-limit') tx.verificationToken.findFirst.mockResolvedValue({});
  if (kind === 'linked-elsewhere') tx.userAccount.findFirst.mockResolvedValue({ userId: 'other' });
  expect(await requestUtilityPasswordRecovery('self', '00123', 'saki')).toBe(RECOVERY_MESSAGE);
  expect(sendUtilityPasswordRecovery).not.toHaveBeenCalled();
});
it('can restore an unlinked account with an existing verified owner mapping', async () => {
  tx.userAccount.findFirst.mockResolvedValue(null);
  await requestUtilityPasswordRecovery('self', '00123', 'saki');
  expect(sendUtilityPasswordRecovery).toHaveBeenCalled();
});
it('cleans up the token when mail delivery fails and never changes a password', async () => {
  (sendUtilityPasswordRecovery as jest.Mock).mockRejectedValue(new Error('private provider message'));
  await expect(requestUtilityPasswordRecovery('self', '00123', 'saki')).rejects.toMatchObject({ status: 503 });
  expect(prisma.verificationToken.deleteMany).toHaveBeenCalled();
});
it('copies only verified profile email and records ownership after 1C accepts it', async () => {
  access = null;
  expect(await syncUtilityAccountEmail('self', '00123', 'saki')).toBe('synced');
  expect(update1CAccountEmail).toHaveBeenCalledWith('00123', 'user@example.test', 'saki');
  expect(tx.utilityAccountAccess.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ userId: 'self', email: 'user@example.test' }) }));
});
it.each(['unverified', 'unsupported', 'other-user', 'unlinked', 'upstream-failure'])('does not register an unsafe recovery mailbox: %s', async kind => {
  access = null;
  if (kind === 'unverified') user.emailVerified = null;
  if (kind === 'other-user') tx.userAccount.findFirst.mockResolvedValue({ userId: 'other' });
  if (kind === 'unlinked') tx.userAccount.findFirst.mockResolvedValue(null);
  if (kind === 'upstream-failure') (update1CAccountEmail as jest.Mock).mockRejectedValue(new Error('failed'));
  await syncUtilityAccountEmail('self', '00123', kind === 'unsupported' ? 'krasn' : 'saki').catch(() => undefined);
  expect(tx.utilityAccountAccess.upsert).not.toHaveBeenCalled();
});
