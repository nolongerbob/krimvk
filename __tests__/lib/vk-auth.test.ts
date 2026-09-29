/** @jest-environment node */
import { createVkFlow, exchangeVkIdentity, isVkAuthEnabled, sameVkState } from '@/lib/vk-auth';
const env = { NODE_ENV: 'development', VK_AUTH_ENABLED: 'true', NEXTAUTH_URL: 'https://dev.krimvk.ru', NEXTAUTH_SECRET: 'test' };
it('only enables explicit HTTPS dev configuration', () => {
  expect(isVkAuthEnabled(env)).toBe(true);
  expect(isVkAuthEnabled({ ...env, NODE_ENV: 'production' })).toBe(false);
  expect(isVkAuthEnabled({ ...env, NEXTAUTH_URL: 'https://krimvk.ru' })).toBe(false);
});
it.each(['vkid', 'ok_ru', 'mail_ru'])('builds bound PKCE flow for %s', service => {
  const flow = createVkFlow(service);
  const url = new URL(flow.url);
  expect(url.searchParams.get('provider')).toBe(service);
  expect(url.searchParams.get('redirect_uri')).toBe('https://dev.krimvk.ru/api/auth/callback/vk');
  expect(url.searchParams.get('state')).toBe(flow.state);
  expect(url.searchParams.has('code_verifier')).toBe(false);
  expect(createVkFlow(service).state).not.toBe(flow.state);
});
it('rejects absent or incorrect state and unsupported providers', () => {
  expect(sameVkState(undefined, undefined)).toBe(false);
  expect(sameVkState('test', 'other')).toBe(false);
  expect(sameVkState('test', 'test')).toBe(true);
  expect(() => createVkFlow('evil')).toThrow();
});
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
it('rejects token state mismatch before fetching user profile', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ state: 'wrong', access_token: 'secret' }) });
  await expect(exchangeVkIdentity('code', 'device', 'verifier', 'expected')).rejects.toThrow();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
it('requires matching server-verified identity and returns no tokens', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ state: 'state', access_token: 'secret', user_id: 123 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { user_id: '123' } }) });
  expect(await exchangeVkIdentity('code', 'device', 'verifier', 'state')).toBe('123');
});
