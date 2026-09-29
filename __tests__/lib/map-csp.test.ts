/** @jest-environment node */
import { buildContentSecurityPolicy } from '@/lib/security/csp';
const originalEnv = process.env;
afterEach(() => { process.env = originalEnv; });
it('allows configured production Google maps without enabling eval or the outage demo', () => {
  process.env = { NODE_ENV: 'production', NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'public-test-key' };
  const csp = buildContentSecurityPolicy();
  expect(csp).toContain('https://maps.googleapis.com');
  expect(csp).toContain('https://maps.gstatic.com');
  expect(csp).toContain('https://fonts.gstatic.com');
  expect(csp).toContain('upgrade-insecure-requests');
  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).not.toContain('tiles.openfreemap.org');
});
it.each([{}, { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'public-test-key', NEXT_PUBLIC_ACCOUNT_HOME_ENABLED: 'false' }])('keeps map origins closed when map is not configured/enabled %#', extra => {
  process.env = { NODE_ENV: 'production', ...extra };
  expect(buildContentSecurityPolicy()).not.toContain('maps.googleapis.com');
});
