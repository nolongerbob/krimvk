/** @jest-environment node */
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/change-email/route';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/get-app-session';
import { sendEmailChangeConfirmation } from '@/lib/resend';
import { requestEmailChange, confirmEmailChange } from '@/lib/email-change';

jest.mock('@/lib/prisma', () => ({ prisma: {
  $transaction: jest.fn(), $queryRaw: jest.fn(),
  user: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  verificationToken: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  emailVerificationToken: { deleteMany: jest.fn() }, passwordResetToken: { deleteMany: jest.fn() },
} }));
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/resend', () => ({ sendEmailChangeConfirmation: jest.fn() }));
const db = prisma as any;
const token = 'a'.repeat(64);
const pending = () => ({ identifier: 'email-change:self:' + JSON.stringify({ oldEmail: 'old@example.test', newEmail: 'new@example.test' }), expires: new Date(Date.now() + 60_000) });
const req = (body: unknown) => new NextRequest('https://example.test/api/auth/change-email', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
  jest.resetAllMocks();
  db.$transaction.mockImplementation((callback: any) => callback(db));
  db.user.findUnique.mockResolvedValue({ id: 'self', email: 'old@example.test' });
  db.user.findFirst.mockResolvedValue(null);
  db.verificationToken.findUnique.mockResolvedValue(pending());
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'self' } });
});
it('requires authentication', async () => {
  (getAppSession as jest.Mock).mockResolvedValue(null);
  expect((await POST(req({ newEmail: 'new@example.test' }))).status).toBe(401);
  expect(db.$transaction).not.toHaveBeenCalled();
});
it.each([{}, { newEmail: 'invalid' }, { action: 'confirm', token: 'invalid' }])('rejects invalid requests', async body => {
  expect((await POST(req(body))).status).toBe(400);
  expect(db.$transaction).not.toHaveBeenCalled();
});
it('normalizes email, stores only a hash and preserves the old profile until confirmation', async () => {
  expect((await POST(req({ newEmail: ' NEW@Example.Test ', userId: 'other' }))).status).toBe(200);
  const [email, raw] = (sendEmailChangeConfirmation as jest.Mock).mock.calls[0];
  expect(email).toBe('new@example.test');
  expect(db.verificationToken.create.mock.calls[0][0].data.token).toBe(createHash('sha256').update(raw).digest('hex'));
  expect(db.verificationToken.create.mock.calls[0][0].data.identifier).toContain('email-change:self:');
  expect(db.user.update).not.toHaveBeenCalled();
  expect(db.emailVerificationToken.deleteMany).not.toHaveBeenCalled();
});
it('fails safely when the mail provider rejects delivery', async () => {
  (sendEmailChangeConfirmation as jest.Mock).mockRejectedValue(new Error('quota'));
  expect((await POST(req({ newEmail: 'new@example.test' }))).status).toBe(503);
  expect(db.user.update).not.toHaveBeenCalled();
  expect(db.verificationToken.deleteMany).toHaveBeenLastCalledWith({ where: { token: expect.any(String) } });
});
it('limits repeat requests', async () => {
  db.verificationToken.findFirst.mockResolvedValue(pending());
  expect((await POST(req({ newEmail: 'new@example.test' }))).status).toBe(429);
  expect(sendEmailChangeConfirmation).not.toHaveBeenCalled();
});
it('rejects occupied email addresses', async () => {
  db.user.findFirst.mockResolvedValue({ id: 'other' });
  await expect(requestEmailChange('self', 'new@example.test')).rejects.toThrow('недоступен');
  expect(sendEmailChangeConfirmation).not.toHaveBeenCalled();
});
it('confirms only the session owner and invalidates old registration and reset links', async () => {
  expect((await POST(req({ action: 'confirm', token, userId: 'other' }))).status).toBe(200);
  expect(db.user.update).toHaveBeenCalledWith({ where: { id: 'self' }, data: { email: 'new@example.test', emailVerified: expect.any(Date) } });
  expect(db.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'self' } });
  expect(db.emailVerificationToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'self' } });
});
it.each(['missing', 'expired', 'other-user', 'old-email-changed'])('rejects %s confirmation', async scenario => {
  if (scenario === 'missing') db.verificationToken.findUnique.mockResolvedValue(null);
  if (scenario === 'expired') db.verificationToken.findUnique.mockResolvedValue({ ...pending(), expires: new Date(0) });
  if (scenario === 'other-user') db.verificationToken.findUnique.mockResolvedValue({ ...pending(), identifier: pending().identifier.replace('self', 'other') });
  if (scenario === 'old-email-changed') db.user.findUnique.mockResolvedValue({ email: 'changed@example.test' });
  await expect(confirmEmailChange('self', token)).rejects.toThrow();
  expect(db.user.update).not.toHaveBeenCalled();
});
it('handles an email uniqueness race without reporting success', async () => {
  db.user.update.mockRejectedValue({ code: 'P2002' });
  await expect(confirmEmailChange('self', token)).rejects.toThrow('недоступен');
});
