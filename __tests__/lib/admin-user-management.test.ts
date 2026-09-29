/** @jest-environment node */
import { deleteAdminUser, updateAdminUserProfile, unlinkAdminUserService, getAdminUserSettings } from '@/lib/admin-user-management';
import { prisma } from '@/lib/prisma';
import { cacheDel } from '@/lib/cache/redis';
import { invalidateUserBalance } from '@/lib/admin-users-index';

jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn(), user: { findUnique: jest.fn() } } }));
jest.mock('@/lib/cache/redis', () => ({ cacheDel: jest.fn() }));
jest.mock('@/lib/admin-users-index', () => ({ invalidateUserBalance: jest.fn() }));
const tx = { $queryRaw: jest.fn(), user: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() }, account: { deleteMany: jest.fn() }, verificationToken: { deleteMany: jest.fn() } };
const baseUser = { id: 'client', email: 'client@example.test', name: 'Client', phone: null, address: null, role: 'USER', _count: { news: 0, pages: 0, posts: 0, applications: 3, questions: 2, userAccounts: 1, meters: 1, bills: 5 } };
let target: typeof baseUser | null;
let actorRole: string;
let credentials: { password: string | null; emailVerified: Date | null; accounts: { id: string; provider: string }[] };
beforeEach(() => {
  jest.clearAllMocks();
  target = { ...baseUser, _count: { ...baseUser._count } }; actorRole = 'ADMIN';
  credentials = { password: 'private-hash', emailVerified: new Date(), accounts: [{ id: 'link', provider: 'yandex' }] };
  (prisma.$transaction as jest.Mock).mockImplementation(fn => fn(tx));
  tx.user.findUnique.mockImplementation(({ where, select }) => where.id === 'admin' ? { role: actorRole } : select.password ? credentials : target);
  tx.user.update.mockResolvedValue({ ...baseUser, name: 'Новое имя' });
  (prisma.user.findUnique as jest.Mock).mockImplementation(async () => target && { ...target, ...credentials });
  jest.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it('updates only whitelisted profile data, normalizes whitespace, and audits IDs without field values', async () => {
  await updateAdminUserProfile('admin', 'client', { name: '  Новое   имя ', phone: '', address: ' Адрес ' });
  expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'client' }, data: { name: 'Новое имя', phone: null, address: 'Адрес' } }));
  expect(console.info).toHaveBeenCalledWith('[admin-user-update]', { actorId: 'admin', userId: 'client', fields: ['name', 'phone', 'address'] });
  expect(tx.$queryRaw).toHaveBeenCalled();
});
it.each([{}, { role: 'ADMIN' }, { name: 'Okay', email: 'attacker@example.test' }, { password: 'changed' }, { name: 'bad\nname' }, { phone: 'x'.repeat(51) }, null])('rejects invalid/mass-assignment profile writes %#', async input => {
  await expect(updateAdminUserProfile('admin', 'client', input)).rejects.toMatchObject({ status: 400 });
  expect(tx.user.update).not.toHaveBeenCalled();
});
it('deletes the chosen ordinary identity and its email-change tokens, then invalidates caches', async () => {
  await deleteAdminUser('admin', 'client', baseUser.email);
  expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'client' } });
  expect(tx.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { identifier: { startsWith: 'email-change:client:' } } });
  expect(cacheDel).toHaveBeenCalledWith('admin-role:client');
  expect(invalidateUserBalance).toHaveBeenCalledWith('client');
});
it.each(['ADMIN', 'news', 'pages', 'posts'])('protects staff accounts and authored %s', async protectedKind => {
  if (protectedKind === 'ADMIN') target!.role = 'ADMIN';
  else target!._count[protectedKind as 'news' | 'pages' | 'posts'] = 1;
  await expect(deleteAdminUser('admin', 'client', baseUser.email)).rejects.toMatchObject({ status: 409 });
  expect(tx.user.delete).not.toHaveBeenCalled();
  expect(tx.verificationToken.deleteMany).not.toHaveBeenCalled();
});
it('blocks self-deletion even if the caller supplies confirmation', async () => {
  tx.user.findUnique.mockResolvedValue({ ...baseUser, id: 'admin', role: 'ADMIN' });
  await expect(deleteAdminUser('admin', 'admin', baseUser.email)).rejects.toMatchObject({ status: 409 });
  expect(tx.user.delete).not.toHaveBeenCalled();
});
it('requires exact confirmation and handles already deleted identities', async () => {
  await expect(deleteAdminUser('admin', 'client', 'wrong@example.test')).rejects.toMatchObject({ status: 400 });
  target = null;
  await expect(deleteAdminUser('admin', 'client', baseUser.email)).rejects.toMatchObject({ status: 404 });
  expect(tx.user.delete).not.toHaveBeenCalled();
});
it('rechecks a cached admin permission inside the transaction before any mutation', async () => {
  actorRole = 'USER';
  await expect(updateAdminUserProfile('admin', 'client', { name: 'No' })).rejects.toMatchObject({ status: 403 });
  await expect(deleteAdminUser('admin', 'client', baseUser.email)).rejects.toMatchObject({ status: 403 });
  await expect(unlinkAdminUserService('admin', 'client', 'link', 'yandex')).rejects.toMatchObject({ status: 403 });
  expect(tx.user.update).not.toHaveBeenCalled(); expect(tx.user.delete).not.toHaveBeenCalled(); expect(tx.account.deleteMany).not.toHaveBeenCalled();
});
it('only unlinks a provider belonging to the target, and requires its confirmation', async () => {
  await expect(unlinkAdminUserService('admin', 'client', 'other-users-link', 'yandex')).rejects.toMatchObject({ status: 404 });
  await expect(unlinkAdminUserService('admin', 'client', 'link', 'vk')).rejects.toMatchObject({ status: 400 });
  expect(tx.account.deleteMany).not.toHaveBeenCalled();
  await unlinkAdminUserService('admin', 'client', 'link', 'yandex');
  expect(tx.account.deleteMany).toHaveBeenCalledWith({ where: { id: 'link', userId: 'client' } });
});
it.each([{ password: null, emailVerified: new Date() }, { password: 'hash', emailVerified: null }])('protects the last login when email/password recovery is unavailable %#', async recovery => {
  Object.assign(credentials, recovery);
  await expect(unlinkAdminUserService('admin', 'client', 'link', 'yandex')).rejects.toMatchObject({ status: 409 });
  expect(tx.account.deleteMany).not.toHaveBeenCalled();
});
it('permits unlinking one of two providers, but protects the remaining last provider', async () => {
  credentials.password = null;
  credentials.accounts.push({ id: 'vk-link', provider: 'vk' });
  await unlinkAdminUserService('admin', 'client', 'link', 'yandex');
  credentials.accounts = [{ id: 'vk-link', provider: 'vk' }];
  await expect(unlinkAdminUserService('admin', 'client', 'vk-link', 'vk')).rejects.toMatchObject({ status: 409 });
  expect(tx.account.deleteMany).toHaveBeenCalledTimes(1);
});
it('returns settings and counts without credentials', async () => {
  const settings = await getAdminUserSettings('admin', 'client');
  expect(settings).toEqual({ linkedServices: [{ id: 'link', provider: 'yandex' }], canUnlinkService: true, deletionBlockReason: null, deletionSummary: { accounts: 1, applications: 3, questions: 2, meters: 1, bills: 5 } });
  expect(JSON.stringify(settings)).not.toContain('private-hash');
  target = null;
  await expect(getAdminUserSettings('admin', 'client')).rejects.toMatchObject({ status: 404 });
});
