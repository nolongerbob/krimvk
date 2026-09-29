/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/accounts/[id]/balance-history/route';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { get1CUserData } from '@/lib/1c-api';
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { userAccount: { findFirst: jest.fn() } } }));
jest.mock('@/lib/1c-api', () => ({ get1CUserData: jest.fn() }));
jest.mock('@/lib/password1c-crypto', () => ({ tryDecryptPassword1c: () => 'test' }));
jest.mock('@/lib/cache/redis', () => ({ cacheGetJson: jest.fn().mockResolvedValue(null), cacheSetJson: jest.fn() }));
const call = () => GET(new NextRequest('http://localhost/api/accounts/a/balance-history'), { params: Promise.resolve({ id: 'a' }) });
beforeEach(() => jest.clearAllMocks());
it('requires a session', async () => {
  (getAppSession as jest.Mock).mockResolvedValue(null);
  expect((await call()).status).toBe(401);
  expect(get1CUserData).not.toHaveBeenCalled();
});
it('does not read a different user account', async () => {
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'u' } });
  (prisma.userAccount.findFirst as jest.Mock).mockResolvedValue(null);
  expect((await call()).status).toBe(404);
  expect(prisma.userAccount.findFirst).toHaveBeenCalledWith({ where: { id: 'a', userId: 'u', isActive: true } });
  expect(get1CUserData).not.toHaveBeenCalled();
});
it('returns six monthly balances and keeps upstream failures missing', async () => {
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'u' } });
  (prisma.userAccount.findFirst as jest.Mock).mockResolvedValue({ accountNumber: 'test', password1c: 'test', region: 'saki' });
  (get1CUserData as jest.Mock).mockResolvedValue({ CommonDuty: '-12,50' }).mockRejectedValueOnce(new Error('Unavailable'));
  const response = await call();
  const data = await response.json();
  expect(data.points).toHaveLength(6);
  expect(data.points[0].value).toBeNull();
  expect(data.points[1].value).toBe(-12.5);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
});
