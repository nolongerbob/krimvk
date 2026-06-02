/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { canonicalHostRedirect } from '@/lib/canonical-host';

describe('canonicalHostRedirect', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('redirects IP host to canonical domain in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.CANONICAL_HOST = 'krimvk.ru';

    const req = new NextRequest('http://89.111.165.160/dashboard', {
      headers: { host: '89.111.165.160' },
    });
    const res = canonicalHostRedirect(req);
    expect(res?.status).toBe(308);
    expect(res?.headers.get('location')).toBe('https://krimvk.ru/dashboard');
  });

  it('does not redirect when already on canonical host', () => {
    process.env.NODE_ENV = 'production';
    process.env.CANONICAL_HOST = 'krimvk.ru';

    const req = new NextRequest('https://krimvk.ru/', {
      headers: { host: 'krimvk.ru' },
    });
    expect(canonicalHostRedirect(req)).toBeNull();
  });

  it('redirects www to apex when canonical is apex', () => {
    process.env.NODE_ENV = 'production';
    process.env.CANONICAL_HOST = 'krimvk.ru';

    const req = new NextRequest('https://www.krimvk.ru/login?x=1', {
      headers: { host: 'www.krimvk.ru' },
    });
    const res = canonicalHostRedirect(req);
    expect(res?.status).toBe(308);
    expect(res?.headers.get('location')).toBe('https://krimvk.ru/login?x=1');
  });
});
