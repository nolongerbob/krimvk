/** @jest-environment node */
import { vkLoginPreviewUrl } from '@/lib/vk-login-preview';

const env = { NODE_ENV: 'development', ESIA_DEV_PREVIEW: 'true' };

it.each(['vkid', 'ok_ru', 'mail_ru'])('selects the requested provider %s', provider => {
  const url = new URL(vkLoginPreviewUrl(env, provider)!);
  expect(url.searchParams.get('provider')).toBe(provider);
  expect(url.searchParams.get('prompt')).toBe('login');
  expect(url.searchParams.get('sdk_type')).toBe('vkid');
  expect(url.searchParams.get('app_id')).toBe(url.searchParams.get('client_id'));
  expect(url.searchParams.get('v')).toBe('2.6.1');
  const stats = JSON.parse(Buffer.from(url.searchParams.get('stats_info')!, 'base64').toString());
  expect(stats.flow_source).toBe('from_multibranding');
  expect(stats.session_id).toEqual(expect.any(String));
});

it('rejects arbitrary providers', () => {
  expect(vkLoginPreviewUrl(env, 'https://example.com')).toBeNull();
});

it('only enables outbound preview in explicit dev mode', () => {
  expect(vkLoginPreviewUrl({})).toBeNull();
  expect(vkLoginPreviewUrl({ ...env, NODE_ENV: 'production' })).toBeNull();
  expect(vkLoginPreviewUrl({ ...env, ESIA_DEV_PREVIEW: 'false' })).toBeNull();
});

it('builds VK authorization with registered callback and fresh PKCE/state without secrets', () => {
  const first = new URL(vkLoginPreviewUrl(env)!);
  const second = new URL(vkLoginPreviewUrl(env)!);
  expect(first.origin + first.pathname).toBe('https://id.vk.ru/authorize');
  expect(first.searchParams.get('client_id')).toBe('54784646');
  expect(first.searchParams.get('redirect_uri')).toBe('https://krimvk.ru/api/auth/callback/vk');
  expect(first.searchParams.get('response_type')).toBe('code');
  expect(first.searchParams.get('code_challenge_method')).toBe('s256');
  for (const key of ['state', 'code_challenge']) {
    expect(first.searchParams.get(key)).toMatch(/^[\w-]{43}$/);
    expect(first.searchParams.get(key)).not.toBe(second.searchParams.get(key));
  }
  expect(first.searchParams.has('client_secret')).toBe(false);
  expect(first.searchParams.has('code_verifier')).toBe(false);
});
