/** @jest-environment node */
import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/user/profile/route';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/get-app-session';
import { authOptions } from '@/lib/auth-config';
jest.mock('@/lib/prisma', () => ({ prisma: { user: { update: jest.fn(), findUnique: jest.fn() } } }));
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/api-route', () => ({ withApiRoute: (fn: unknown) => fn }));
jest.mock('@/lib/auth', () => ({ getUserByEmail: jest.fn(), verifyPassword: jest.fn() }));
jest.mock('@/lib/site-url', () => ({ applyCanonicalSiteUrl: jest.fn() }));
const request = (body: unknown) => new NextRequest('https://example.test/api/user/profile', { method: 'PUT', body: JSON.stringify(body) });
beforeEach(() => {
  jest.clearAllMocks();
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'self' } });
  (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'self', name: 'Анна Мария' });
});
it('only updates the authenticated profile and never email, role or another user', async () => {
  expect((await PUT(request({ name: '  Анна   Мария  ', id: 'other', email: 'other@example.test', role: 'ADMIN' }))).status).toBe(200);
  expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'self' }, data: { name: 'Анна Мария' } }));
});
it.each(['', '   ', 'a'.repeat(151), 123, null, 'Имя\u0000'])('rejects invalid name %s before writing', async name => {
  expect((await PUT(request({ name }))).status).toBe(400);
  expect(prisma.user.update).not.toHaveBeenCalled();
});
it('requires authentication', async () => {
  (getAppSession as jest.Mock).mockResolvedValue(null);
  expect((await PUT(request({ name: 'Анна' }))).status).toBe(401);
  expect(prisma.user.update).not.toHaveBeenCalled();
});
it('preserves phone-only updates for existing clients', async () => {
  expect((await PUT(request({ phone: '+79991234567' }))).status).toBe(200);
  expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { phone: '+79991234567' } }));
});
it('refreshes the JWT name from the database, ignoring client-provided permissions', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ name: 'Новое имя', email: 'self@example.test' });
  const token = { id: 'self', name: 'Старое имя', role: 'USER', email: 'self@example.test' };
  const jwt = authOptions.callbacks!.jwt!;
  const result = await jwt({ token, trigger: 'update', session: { name: 'Подмена', role: 'ADMIN', id: 'other' } } as any);
  expect(result).toEqual({ ...token, name: 'Новое имя', role: 'USER' });
  expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'self' }, select: { name: true, email: true } });
});
it('does not add a database read to ordinary JWT checks', async () => {
  await authOptions.callbacks!.jwt!({ token: { id: 'self', name: 'Имя' } } as any);
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
});
