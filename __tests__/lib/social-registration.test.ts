/** @jest-environment node */
import { completeSocialRegistration, readSocialDraft } from '@/lib/social-registration';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/prisma', () => ({ prisma: { $transaction: jest.fn() } }));
const draft = { provider: 'vk' as const, externalId: 'external', nonce: 'nonce', name: 'Name', email: 'old@example.invalid', phone: '' };
const fields = { name: 'Edited Name', email: 'new@example.invalid', password: 'already-hashed', phone: '123' };
let tx: any;
beforeEach(() => {
  tx = { verificationToken: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) }, user: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'new-user' }) }, account: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() } };
  (prisma.$transaction as jest.Mock).mockImplementation(fn => fn(tx));
});
it('rejects any existing email, including unverified, without creating or linking', async () => {
  tx.user.findFirst.mockResolvedValue({ id: 'existing', emailVerified: null });
  await expect(completeSocialRegistration(draft, fields)).rejects.toThrow('EMAIL_EXISTS');
  expect(tx.user.create).not.toHaveBeenCalled();
  expect(tx.account.create).not.toHaveBeenCalled();
});
it('rejects reused proofs and already-linked identities', async () => {
  tx.verificationToken.deleteMany.mockResolvedValue({ count: 0 });
  await expect(completeSocialRegistration(draft, fields)).rejects.toThrow('EXPIRED');
  tx.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
  tx.account.findUnique.mockResolvedValue({ userId: 'other' });
  await expect(completeSocialRegistration(draft, fields)).rejects.toThrow('IDENTITY_EXISTS');
  expect(tx.user.create).not.toHaveBeenCalled();
});
it('creates edited fields and the proven identity together without confirming edited email', async () => {
  await completeSocialRegistration(draft, fields);
  expect(tx.user.create).toHaveBeenCalledWith({ data: { ...fields, role: 'USER', emailVerified: null } });
  expect(tx.account.create).toHaveBeenCalledWith({ data: { userId: 'new-user', provider: 'vk', providerAccountId: 'external', type: 'oauth' } });
  expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
});
it('rejects forged browser proof', async () => {
  expect(await readSocialDraft('forged')).toBeNull();
});
