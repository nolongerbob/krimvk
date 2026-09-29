/** @jest-environment node */
import { deleteOwnAccount } from '@/lib/delete-own-account';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ verifyPassword: jest.fn() }));
jest.mock('@/lib/cache/redis', () => ({ cacheDel: jest.fn() }));
jest.mock('@/lib/admin-users-index', () => ({ invalidateUserBalance: jest.fn() }));
const tx = { $queryRaw: jest.fn(), user: { findUnique: jest.fn(), delete: jest.fn() }, verificationToken: { deleteMany: jest.fn() } };
beforeEach(() => {
  jest.clearAllMocks();
  (prisma.$transaction as jest.Mock).mockImplementation(fn => fn(tx));
  tx.user.findUnique.mockResolvedValue({ id: 'owner', password: 'hash', role: 'USER', _count: { news: 0, pages: 0, posts: 0 } });
  (verifyPassword as jest.Mock).mockResolvedValue(true);
});
it('deletes only the authenticated identity after password verification', async () => {
  await deleteOwnAccount('owner', 'secret');
  expect(verifyPassword).toHaveBeenCalledWith('secret', 'hash');
  expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'owner' } });
  expect(tx.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { identifier: { startsWith: 'email-change:owner:' } } });
});
it('rejects a wrong password without any deletes', async () => {
  (verifyPassword as jest.Mock).mockResolvedValue(false);
  await expect(deleteOwnAccount('owner', 'wrong')).rejects.toMatchObject({ status: 403 });
  expect(tx.user.delete).not.toHaveBeenCalled();
  expect(tx.verificationToken.deleteMany).not.toHaveBeenCalled();
});
it.each([
  { role: 'ADMIN', password: 'hash', _count: { news: 0, pages: 0, posts: 0 } },
  { role: 'USER', password: 'hash', _count: { news: 1, pages: 0, posts: 0 } },
  { role: 'USER', password: null, _count: { news: 0, pages: 0, posts: 0 } },
])('refuses unsafe deletion %#', async user => {
  tx.user.findUnique.mockResolvedValue(user);
  await expect(deleteOwnAccount('owner', 'secret')).rejects.toMatchObject({ status: 409 });
  expect(tx.user.delete).not.toHaveBeenCalled();
});
it('handles an already removed user', async () => {
  tx.user.findUnique.mockResolvedValue(null);
  await expect(deleteOwnAccount('owner', 'secret')).rejects.toMatchObject({ status: 404 });
});
