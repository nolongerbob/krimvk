import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const VK_FLOW_COOKIE = '__Secure-krimvk-vk-flow';
export const VK_SERVICES = ['vkid', 'ok_ru', 'mail_ru'] as const;
export function isVkAuthEnabled(env: Record<string, string | undefined> = process.env) {
  return env.NODE_ENV === 'development' && env.VK_AUTH_ENABLED === 'true'
    && env.NEXTAUTH_URL === 'https://dev.krimvk.ru' && !!env.NEXTAUTH_SECRET;
}
export const vkCallback = 'https://dev.krimvk.ru/api/auth/callback/vk';
export function hashVkState(state: string) { return createHash('sha256').update(state).digest('hex'); }
export function sameVkState(a: unknown, b: unknown) {
  return typeof a === 'string' && typeof b === 'string' && a.length > 0
    && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function createVkFlow(service: string) {
  if (!(VK_SERVICES as readonly string[]).includes(service)) throw new Error('Invalid provider');
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const url = new URL('https://id.vk.ru/authorize');
  url.search = new URLSearchParams({ client_id: '54784646', app_id: '54784646', sdk_type: 'vkid',
    v: '2.6.1', redirect_uri: vkCallback, response_type: 'code', scope: '', provider: service,
    prompt: 'login', state, code_challenge_method: 'S256',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
  }).toString();
  return { state, verifier, url: url.toString() };
}

/** Only the server exchanges the code. Never return/store OAuth tokens in the app session. */
export async function exchangeVkProfile(code: string, deviceId: string, verifier: string, state: string) {
  const response = await fetch('https://id.vk.ru/oauth2/auth', {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
    body: new URLSearchParams({ grant_type: 'authorization_code', code, device_id: deviceId,
      client_id: '54784646', redirect_uri: vkCallback, code_verifier: verifier, state }),
  });
  const tokens = await response.json();
  if (!response.ok || tokens.error || typeof tokens.access_token !== 'string' || !sameVkState(tokens.state, state)) throw new Error('VK exchange failed');
  const info = await fetch('https://id.vk.ru/oauth2/user_info', {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
    body: new URLSearchParams({ client_id: '54784646', access_token: tokens.access_token }),
  });
  const profile = await info.json();
  const id = String(profile?.user?.user_id ?? '');
  if (!info.ok || profile.error || !/^\d+$/.test(id) || id === '0' || id !== String(tokens.user_id)) throw new Error('VK identity mismatch');
  return { id, name: [profile.user.first_name, profile.user.last_name].filter(v => typeof v === 'string').join(' ').slice(0, 200),
    email: typeof profile.user.email === 'string' ? profile.user.email : '', phone: typeof profile.user.phone === 'string' ? profile.user.phone : '' };
}
export async function exchangeVkIdentity(code: string, deviceId: string, verifier: string, state: string) {
  return (await exchangeVkProfile(code, deviceId, verifier, state)).id;
}
