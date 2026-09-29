import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { isEsiaPreviewEnabled } from './esia-preparation';

/** Outbound-only preview. No exchange, account writes or session creation. */
export function vkLoginPreviewUrl(env: Record<string, string | undefined> = process.env, provider = 'vkid'): string | null {
  if (!isEsiaPreviewEnabled(env)) return null;
  if (!['vkid', 'ok_ru', 'mail_ru'].includes(provider)) return null;
  const verifier = randomBytes(32).toString('base64url');
  const url = new URL('https://id.vk.ru/authorize');
  url.search = new URLSearchParams({
    // Match OAuthList -> Auth.login -> getVKIDUrl in VK ID SDK 2.6.1.
    // https://github.com/VKCOM/vkid-web-sdk/blob/master/src/utils/url/url.ts
    sdk_type: 'vkid',
    v: '2.6.1',
    app_id: '54784646',
    client_id: '54784646',
    redirect_uri: 'https://krimvk.ru/api/auth/callback/vk',
    response_type: 'code',
    provider,
    prompt: 'login',
    lang_id: '0',
    scheme: 'light',
    stats_info: Buffer.from(JSON.stringify({
      flow_source: 'from_multibranding',
      session_id: randomUUID(),
    })).toString('base64'),
    scope: '',
    state: randomBytes(32).toString('base64url'),
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 's256',
  }).toString();
  // Deliberately do not persist verifier: this preview cannot exchange the code.
  return url.toString();
}
