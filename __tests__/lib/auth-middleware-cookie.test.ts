/** @jest-environment node */
import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { getAuthJwtFromRequest } from '@/lib/auth-middleware-token';

const original = { ...process.env };
afterEach(() => { process.env = { ...original }; });
it.each([
  ['https://dev.krimvk.ru', '__Secure-next-auth.session-token'],
  ['http://localhost:3006', 'next-auth.session-token'],
  ['https://krimvk.ru', '__Secure-next-auth.session-token'],
])('accepts the same session cookie as NextAuth on %s', async (origin, cookie) => {
  process.env.NEXTAUTH_URL = origin;
  process.env.NEXTAUTH_SECRET = 'test-secret-only';
  const token = await encode({ secret: 'test-secret-only', token: { id: 'test-user', sub: 'test-user', email: 'test@example.invalid' } });
  const req = new NextRequest(origin + '/dashboard', { headers: { cookie: cookie + '=' + token } });
  expect((await getAuthJwtFromRequest(req))?.id).toBe('test-user');
});
it('does not accept the stale HTTP cookie when configured for HTTPS', async () => {
  process.env.NEXTAUTH_URL = 'https://dev.krimvk.ru';
  process.env.NEXTAUTH_SECRET = 'test-secret-only';
  const token = await encode({ secret: 'test-secret-only', token: { id: 'test-user', email: 'test@example.invalid' } });
  const req = new NextRequest('https://dev.krimvk.ru/dashboard', { headers: { cookie: 'next-auth.session-token=' + token } });
  expect(await getAuthJwtFromRequest(req)).toBeNull();
});
