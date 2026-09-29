/** @jest-environment node */
import { linkAdminUserAccount } from '@/lib/admin-link-user-account';
import { prisma } from '@/lib/prisma';
import { get1CUserData } from '@/lib/1c-api';
import { syncUtilityAccountEmail } from '@/lib/utility-account-email';
import { invalidateUserBalance } from '@/lib/admin-users-index';
import { decryptPassword1c } from '@/lib/password1c-crypto';
jest.mock('server-only', () => ({}));
jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn(), user: { findUnique: jest.fn() }, userAccount: { findUnique: jest.fn() } } }));
jest.mock('@/lib/1c-api', () => ({ get1CUserData: jest.fn() }));
jest.mock('@/lib/utility-account-email', () => ({ syncUtilityAccountEmail: jest.fn() }));
jest.mock('@/lib/admin-users-index', () => ({ invalidateUserBalance: jest.fn() }));
jest.mock('@/lib/cache/redis', () => ({ cacheDel: jest.fn() }));
const input = { accountNumber: '123', password1c: 'Legacy123', region: 'saki' };
const tx = { $queryRaw: jest.fn(), user: { findUnique: jest.fn() }, userAccount: { findUnique: jest.fn(), create: jest.fn() }, utilityAccountAccess: { findUnique: jest.fn() }, utilityPasswordChange: { findFirst: jest.fn() } };
const fixture = { id: 'account', accountNumber: '123', region: 'saki', address: 'Адрес', name: 'Абонент', phone: null, meters: [] };
const payload = { LSCode: '123', LSName: 'Абонент', Address: 'Адрес', MeteringDevices: [{ Number: 'M-1', ServiceName: 'Холодная вода', LastReading: '12,5' }, { Number: 'M-1', LastReading: '12,5' }] };
beforeEach(() => {
  jest.resetAllMocks(); process.env.PASSWORD1C_ENCRYPTION_KEY = 'test-link-account';
  const user = ({ where }: any) => Promise.resolve(where.id === 'admin' ? { id: 'admin', role: 'ADMIN' } : { id: 'client' });
  (prisma.user.findUnique as jest.Mock).mockImplementation(user); tx.user.findUnique.mockImplementation(user);
  (prisma.$transaction as jest.Mock).mockImplementation(fn => fn(tx));
  (get1CUserData as jest.Mock).mockResolvedValue(payload);
  (syncUtilityAccountEmail as jest.Mock).mockResolvedValue('synced');
  tx.userAccount.create.mockResolvedValue(fixture);
  jest.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => { delete process.env.PASSWORD1C_ENCRYPTION_KEY; jest.restoreAllMocks(); });
it('links to the selected user, freshly validates 1C and creates meters atomically with encrypted credentials', async () => {
  expect(await linkAdminUserAccount('admin', 'client', { ...input, accountNumber: ' 123 ' })).toEqual({ account: fixture, emailSyncPending: false });
  expect(get1CUserData).toHaveBeenCalledWith('123', 'Legacy123', 'saki', undefined, undefined, { bypassCache: true });
  const { data, select } = tx.userAccount.create.mock.calls[0][0];
  expect(data.userId).toBe('client'); expect(data.password1c).not.toBe(input.password1c); expect(decryptPassword1c(data.password1c)).toBe(input.password1c);
  expect(data.meters.create).toEqual([{ userId: 'client', serialNumber: 'M-1', address: 'Адрес', type: 'холодная', lastReading: 12.5 }]);
  expect(select.password1c).toBeUndefined(); expect(select.userId).toBeUndefined();
  expect(syncUtilityAccountEmail).toHaveBeenCalledWith('client', '123', 'saki'); expect(invalidateUserBalance).toHaveBeenCalledWith('client');
  expect(JSON.stringify((console.info as jest.Mock).mock.calls)).not.toContain(input.password1c);
});
it.each([null, {}, { ...input, userId: 'other' }, { ...input, accountNumber: 'a/b' }, { ...input, password1c: '' }, { ...input, region: '../saki' }])('rejects invalid input and ownership injection %#', async value => {
  await expect(linkAdminUserAccount('admin', 'client', value)).rejects.toMatchObject({ status: 400 }); expect(get1CUserData).not.toHaveBeenCalled();
});
it('requires admin permission and an existing recipient before querying 1C', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ role: 'USER' });
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 403 });
  (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ role: 'ADMIN' }).mockResolvedValueOnce(null);
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 404 }); expect(get1CUserData).not.toHaveBeenCalled();
});
it.each(['client', 'other'])('does not duplicate or transfer an account owned by %s', async userId => {
  (prisma.userAccount.findUnique as jest.Mock).mockResolvedValue({ userId });
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 409 }); expect(get1CUserData).not.toHaveBeenCalled(); expect(tx.userAccount.create).not.toHaveBeenCalled();
});
it('does not contact 1C without encrypted storage configured', async () => {
  delete process.env.PASSWORD1C_ENCRYPTION_KEY;
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 503 }); expect(get1CUserData).not.toHaveBeenCalled();
});
it.each([new Error('AUTH_ERROR: secret credential'), new Error('TIMEOUT secret credential')])('sanitizes 1C failures and never writes after failed validation %#', async error => {
  (get1CUserData as jest.Mock).mockRejectedValue(error);
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.not.toThrow('secret credential');
  expect(tx.userAccount.create).not.toHaveBeenCalled(); expect(syncUtilityAccountEmail).not.toHaveBeenCalled();
});
it.each([{}, { Error: 'wrong password' }, { ...payload, LSCode: '999' }])('rejects empty/error/mismatched payloads %#', async data => {
  (get1CUserData as jest.Mock).mockResolvedValue(data);
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toThrow(); expect(tx.userAccount.create).not.toHaveBeenCalled();
});
it('rechecks roles, existence and collisions under database locks', async () => {
  tx.user.findUnique.mockResolvedValueOnce({ role: 'USER' });
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 403 });
  tx.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' }).mockResolvedValueOnce(null);
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 404 });
  tx.userAccount.findUnique.mockResolvedValue({ userId: 'other' });
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 409 }); expect(tx.userAccount.create).not.toHaveBeenCalled();
});
it.each(['pending', 'just-completed'])('blocks binding a stale password during a %s reset', async phase => {
  if (phase === 'pending') tx.utilityAccountAccess.findUnique.mockResolvedValue({ pendingChangeId: 'reset' });
  else tx.utilityPasswordChange.findFirst.mockResolvedValue({ id: 'reset' });
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 409 }); expect(tx.userAccount.create).not.toHaveBeenCalled();
});
it('reports unique collisions without leaking database details', async () => {
  tx.userAccount.create.mockRejectedValue({ code: 'P2002', details: 'private' });
  await expect(linkAdminUserAccount('admin', 'client', input)).rejects.toMatchObject({ status: 409 }); expect(syncUtilityAccountEmail).not.toHaveBeenCalled();
});
it('supports other regions without calling the Saki-only email method', async () => {
  await linkAdminUserAccount('admin', 'client', { ...input, region: 'krasn' });
  expect(tx.userAccount.create).toHaveBeenCalled(); expect(syncUtilityAccountEmail).not.toHaveBeenCalled();
});
it('keeps a successful link when email sync is unavailable', async () => {
  (syncUtilityAccountEmail as jest.Mock).mockRejectedValue(new Error('READ_ONLY'));
  expect((await linkAdminUserAccount('admin', 'client', input)).emailSyncPending).toBe(true);
});
