import crypto from 'crypto';

const PURPOSE = 'post_verify_login';
const TTL_MS = 15 * 60 * 1000;

function signingSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set');
  }
  return secret;
}

/** Одноразовый (по времени) токен для auto-login только после подтверждения email на том же устройстве. */
export function createPostVerifyLoginToken(userId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${PURPOSE}:${userId}:${exp}`;
  const sig = crypto.createHmac('sha256', signingSecret()).update(payload).digest('base64url');
  const body = Buffer.from(payload, 'utf8').toString('base64url');
  return `${body}.${sig}`;
}

export function verifyPostVerifyLoginToken(token: string): { userId: string } | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!body || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(body, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = crypto
    .createHmac('sha256', signingSecret())
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const [purpose, userId, expStr] = payload.split(':');
  if (purpose !== PURPOSE || !userId || !expStr) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  return { userId };
}
