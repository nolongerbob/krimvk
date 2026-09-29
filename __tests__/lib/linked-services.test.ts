/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/linked-services/route';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { isEsiaPreviewEnabled } from '@/lib/esia-preparation';
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { account: { findMany: jest.fn() } } }));
jest.mock('@/lib/esia-preparation', () => ({ isEsiaPreviewEnabled: jest.fn() }));
jest.mock('@/lib/yandex-auth', () => ({ isYandexAuthEnabled: () => true }));
beforeEach(() => { jest.clearAllMocks(); (isEsiaPreviewEnabled as jest.Mock).mockReturnValue(true); });
it('rejects anonymous status requests without querying accounts', async () => {
  (getAppSession as jest.Mock).mockResolvedValue(null);
  expect((await GET(new NextRequest('http://localhost/api/auth/linked-services'))).status).toBe(401);
  expect(prisma.account.findMany).not.toHaveBeenCalled();
});
it('reads only current user providers and returns no identity or token data', async () => {
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'current-user' } });
  (prisma.account.findMany as jest.Mock).mockResolvedValue([{ provider: 'yandex' }]);
  const response = await GET(new NextRequest('http://localhost/api/auth/linked-services?userId=other'));
  expect(prisma.account.findMany).toHaveBeenCalledWith({ where: { userId: 'current-user' }, select: { provider: true } });
  expect((await response.json()).services).toContainEqual({ id: 'yandex', linked: true, available: true });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
it('stays disabled outside the preview', async () => {
  (isEsiaPreviewEnabled as jest.Mock).mockReturnValue(false);
  expect((await GET(new NextRequest('http://localhost/api/auth/linked-services'))).status).toBe(404);
  expect(prisma.account.findMany).not.toHaveBeenCalled();
});
