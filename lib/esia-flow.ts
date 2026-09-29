import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { encode, decode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { getEsiaPreparation } from '@/lib/esia-config';

export const ESIA_FLOW_COOKIE = '__Secure-krimvk-esia-flow';
export const ESIA_FLOW_SECONDS = 300;
export const esiaFlowCookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: ESIA_FLOW_SECONDS };
const digest = (state: string) => createHash('sha256').update(state).digest('hex');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type EsiaIntent = { mode: 'login' | 'register'; userId?: never } | { mode: 'link'; userId: string };

/** Internal building block only. No public route starts a flow until the
 * certificate signer and verified token exchange have been implemented. */
export async function createEsiaFlow(intent: EsiaIntent) {
  if (!getEsiaPreparation().configurationReady) throw new Error('ESIA_NOT_CONFIGURED');
  if (!['login', 'register', 'link'].includes(intent.mode) || (intent.mode === 'link' && !intent.userId)) throw new Error('ESIA_INVALID_INTENT');
  const state = randomUUID();
  const cookie = await encode({ secret: process.env.NEXTAUTH_SECRET!, maxAge: ESIA_FLOW_SECONDS,
    token: { id: 'esia-flow', email: '', purpose: 'esia-flow', realm: 'test', state, mode: intent.mode, ownerId: intent.userId || null } });
  await prisma.verificationToken.create({ data: { identifier: 'esia-flow:test', token: digest(state), expires: new Date(Date.now() + ESIA_FLOW_SECONDS * 1000) } });
  return { state, cookie };
}

/** Validates callback correlation, NOT identity. Never authorizes a user by itself. */
export async function consumeEsiaFlow(cookie: string | undefined, state: string | null, currentUserId?: string): Promise<EsiaIntent | null> {
  if (!getEsiaPreparation().configurationReady || !cookie || !state || !uuid.test(state)) return null;
  try {
    const token = await decode({ token: cookie, secret: process.env.NEXTAUTH_SECRET! });
    if (!token || token.purpose !== 'esia-flow' || token.realm !== 'test'
      || typeof token.state !== 'string' || !uuid.test(token.state)
      || !timingSafeEqual(Buffer.from(state), Buffer.from(token.state))
      || !['login', 'register', 'link'].includes(String(token.mode))) return null;
    if (token.mode === 'link' && (!currentUserId || token.ownerId !== currentUserId)) return null;
    // Do not switch an already authenticated browser to a different identity.
    if (token.mode !== 'link' && currentUserId) return null;
    const consumed = await prisma.verificationToken.deleteMany({ where: {
      identifier: 'esia-flow:test', token: digest(state), expires: { gt: new Date() },
    } });
    if (consumed.count !== 1) return null;
    return token.mode === 'link' ? { mode: 'link', userId: currentUserId! } : { mode: token.mode as 'login' | 'register' };
  } catch { return null; }
}
