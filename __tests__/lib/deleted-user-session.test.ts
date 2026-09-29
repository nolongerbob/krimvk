/** @jest-environment node */
jest.mock('@/lib/auth', () => ({ getUserByEmail: jest.fn(), verifyPassword: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));
jest.mock('@/lib/site-url', () => ({ applyCanonicalSiteUrl: jest.fn() }));
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
it('does not grant a session for a removed user with a still-valid JWT', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  const session = authOptions.callbacks!.session!;
  expect(await session({ session: { user: {} }, token: { id: 'deleted', email: 'old@example.test', role: 'ADMIN' } } as any)).toBeNull();
});
it('keeps existing account sessions working', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'exists' });
  const session = authOptions.callbacks!.session!;
  expect(await session({ session: { user: {} }, token: { id: 'exists', email: 'ok@example.test', role: 'USER' } } as any)).toMatchObject({ user: { id: 'exists' } });
});
