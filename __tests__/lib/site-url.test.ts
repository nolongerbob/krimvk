/**
 * @jest-environment node
 */
import { applyCanonicalSiteUrl, getSiteBaseUrl } from '@/lib/site-url';

describe('site-url', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('uses SITE_URL over IP NEXTAUTH_URL in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SITE_URL = 'https://krimvk.ru';
    process.env.NEXTAUTH_URL = 'http://89.111.165.160';
    delete process.env.ALLOW_IP_PUBLIC_URL;

    expect(getSiteBaseUrl()).toBe('https://krimvk.ru');
  });

  it('applyCanonicalSiteUrl replaces IP NEXTAUTH_URL in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SITE_URL = 'https://krimvk.ru';
    process.env.NEXTAUTH_URL = 'http://89.111.165.160';
    delete process.env.ALLOW_IP_PUBLIC_URL;

    applyCanonicalSiteUrl();
    expect(process.env.NEXTAUTH_URL).toBe('https://krimvk.ru');
  });

  it('allows IP when ALLOW_IP_PUBLIC_URL=1', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXTAUTH_URL = 'http://10.0.0.1';
    process.env.ALLOW_IP_PUBLIC_URL = '1';
    delete process.env.SITE_URL;

    expect(getSiteBaseUrl()).toBe('http://10.0.0.1');
  });
});
