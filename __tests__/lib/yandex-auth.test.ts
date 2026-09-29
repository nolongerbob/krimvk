/** @jest-environment node */
import { isYandexAuthEnabled } from '@/lib/yandex-auth';
jest.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, getAll: () => [], set: jest.fn() }) }));
jest.mock('@/lib/social-registration', () => ({ createSocialDraft: jest.fn().mockResolvedValue('draft'), SOCIAL_REG_COOKIE: 'draft-cookie', socialCookieOptions: () => ({}) }));
jest.mock('@/lib/auth', () => ({ getUserByEmail: jest.fn(), verifyPassword: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: { account: { findUnique: jest.fn(), create: jest.fn() }, user: { create: jest.fn() } } }));
jest.mock('@/lib/site-url', () => ({ applyCanonicalSiteUrl: jest.fn() }));

const config = { NODE_ENV: 'development', YANDEX_AUTH_ENABLED: 'true', YANDEX_CLIENT_ID: 'test', YANDEX_CLIENT_SECRET: 'test' };
it('requires complete explicit dev configuration and stays off in production', () => {
  expect(isYandexAuthEnabled(config)).toBe(true);
  expect(isYandexAuthEnabled({ ...config, NODE_ENV: 'production' })).toBe(false);
  expect(isYandexAuthEnabled({ ...config, YANDEX_AUTH_ENABLED: undefined })).toBe(false);
  expect(isYandexAuthEnabled({ ...config, YANDEX_CLIENT_SECRET: '' })).toBe(false);
});

it('offers registration for unlinked identity without creating a user and uses local role for linked users', async () => {
  const previous = { ...process.env };
  Object.assign(process.env, config);
  try {
    const { authOptions } = await import('@/lib/auth-config');
    const { prisma } = await import('@/lib/prisma');
    const find = prisma.account.findUnique as jest.Mock;
    const signIn = authOptions.callbacks!.signIn!;
    find.mockResolvedValue(null);
    expect(await signIn({ account: { provider: 'yandex', providerAccountId: 'external' }, user: { email: 'same@example.invalid' } } as any)).toBe('/register?social=1');
    expect(prisma.account.create).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
    find.mockResolvedValue({ user: { id: 'local', email: 'local@example.invalid', name: 'Local', role: 'USER' } });
    const user = { id: 'external', role: 'ADMIN' };
    expect(await signIn({ account: { provider: 'yandex', providerAccountId: 'external' }, user } as any)).toBe(true);
    expect(user).toMatchObject({ id: 'local', role: 'USER' });
  } finally { process.env = previous; }
});
