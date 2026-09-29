/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/callback/vk/route';
import { decode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { getAppSession } from '@/lib/get-app-session';
import { exchangeVkProfile } from '@/lib/vk-auth';
jest.mock('next-auth/jwt', () => ({ decode: jest.fn(), encode: jest.fn().mockResolvedValue('session') }));
jest.mock('@/lib/get-app-session', () => ({ getAppSession: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { verificationToken: { deleteMany: jest.fn() }, account: { findUnique: jest.fn() }, $transaction: jest.fn() } }));
jest.mock('@/lib/vk-auth', () => ({ ...jest.requireActual('@/lib/vk-auth'), isVkAuthEnabled: () => true, exchangeVkProfile: jest.fn() }));
jest.mock('@/lib/social-registration', () => ({ createSocialDraft: jest.fn().mockResolvedValue('draft'), SOCIAL_REG_COOKIE: 'draft-cookie', socialCookieOptions: () => ({}) }));
const request = () => new NextRequest('https://dev.krimvk.ru/api/auth/callback/vk?state=valid&code=code&device_id=device');
beforeEach(() => {
  jest.clearAllMocks();
  (decode as jest.Mock).mockResolvedValue({ purpose: 'vk-oauth', state: 'valid', verifier: 'verifier', mode: 'login' });
  (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
  (getAppSession as jest.Mock).mockResolvedValue(null);
  (exchangeVkProfile as jest.Mock).mockResolvedValue({ id: '123', name: 'User', email: '' });
});
it('rejects replay before exchange', async () => {
  (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
  expect((await GET(request())).headers.get('location')).toContain('VkExpired');
  expect(exchangeVkProfile).not.toHaveBeenCalled();
});
it('does not create or link accounts on an unlinked login', async () => {
  (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
  expect((await GET(request())).headers.get('location')).toContain('/register?social=1');
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it('rejects linking if the current session changed', async () => {
  (decode as jest.Mock).mockResolvedValue({ purpose: 'vk-oauth', state: 'valid', verifier: 'verifier', mode: 'link', userId: 'owner' });
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: 'other' } });
  expect((await GET(request())).headers.get('location')).toContain('VkExpired');
  expect(exchangeVkProfile).not.toHaveBeenCalled();
});
it('sets secure session from the linked local user', async () => {
  (prisma.account.findUnique as jest.Mock).mockResolvedValue({ userId: 'local', user: { id: 'local', name: 'User', email: 'test@example.invalid', role: 'USER' } });
  const response = await GET(request());
  expect(response.headers.get('location')).toBe('https://dev.krimvk.ru/dashboard');
  expect(response.cookies.get('__Secure-next-auth.session-token')?.value).toBe('session');
});
