import { randomBytes, createHash } from 'node:crypto';
import { decode, encode } from 'next-auth/jwt';
import { prisma } from './prisma';
import { isYandexAuthEnabled } from './yandex-auth';
import { isVkAuthEnabled } from './vk-auth';

export const SOCIAL_REG_COOKIE = 'krimvk-social-registration';
export const socialCookieOptions = () => ({ httpOnly: true, secure: !!process.env.NEXTAUTH_URL?.startsWith('https:'), sameSite: 'lax' as const, path: '/', maxAge: 600 });
export type SocialDraft = { provider: 'vk' | 'yandex'; externalId: string; nonce: string; name: string; email: string; phone: string };
const digest = (nonce: string) => createHash('sha256').update(nonce).digest('hex');
export function socialProviderEnabled(provider: string) { return provider === 'vk' ? isVkAuthEnabled() : provider === 'yandex' && isYandexAuthEnabled(); }

export async function createSocialDraft(provider: SocialDraft['provider'], externalId: string, fields: { name?: string | null; email?: string | null; phone?: string | null }) {
  if (!socialProviderEnabled(provider) || !externalId || externalId.length > 256) throw new Error('Registration unavailable');
  const nonce = randomBytes(32).toString('hex');
  const token = await encode({ secret: process.env.NEXTAUTH_SECRET!, maxAge: 600, token: {
    id: 'registration-draft', email: '', purpose: 'social-registration', provider, externalId, nonce,
    draftName: (fields.name || '').slice(0, 200), draftEmail: (fields.email || '').slice(0, 254), draftPhone: (fields.phone || '').slice(0, 40),
  } });
  await prisma.verificationToken.create({ data: { identifier: 'social-registration', token: digest(nonce), expires: new Date(Date.now() + 600000) } });
  return token;
}

export async function readSocialDraft(token?: string): Promise<SocialDraft | null> {
  try {
    const data = await decode({ token, secret: process.env.NEXTAUTH_SECRET! });
    if (!data || data.purpose !== 'social-registration' || !socialProviderEnabled(String(data.provider))
      || typeof data.externalId !== 'string' || typeof data.nonce !== 'string') return null;
    const valid = await prisma.verificationToken.findFirst({ where: { identifier: 'social-registration', token: digest(data.nonce), expires: { gt: new Date() } } });
    if (!valid) return null;
    return { provider: data.provider as SocialDraft['provider'], externalId: data.externalId, nonce: data.nonce,
      name: String(data.draftName || ''), email: String(data.draftEmail || ''), phone: String(data.draftPhone || '') };
  } catch { return null; }
}

/** The proof, user and link are committed together; no partial registrations. */
export async function completeSocialRegistration(draft: SocialDraft, fields: { name: string; email: string; phone?: string; password: string }) {
  return prisma.$transaction(async tx => {
    const used = await tx.verificationToken.deleteMany({ where: { identifier: 'social-registration', token: digest(draft.nonce), expires: { gt: new Date() } } });
    if (used.count !== 1) throw new Error('EXPIRED');
    // Even an unverified pre-existing email must never be taken over.
    if (await tx.user.findFirst({ where: { email: { equals: fields.email, mode: 'insensitive' } } })) throw new Error('EMAIL_EXISTS');
    if (await tx.account.findUnique({ where: { provider_providerAccountId: { provider: draft.provider, providerAccountId: draft.externalId } } })) throw new Error('IDENTITY_EXISTS');
    const user = await tx.user.create({ data: { ...fields, role: 'USER', emailVerified: null } });
    await tx.account.create({ data: { userId: user.id, provider: draft.provider, providerAccountId: draft.externalId, type: 'oauth' } });
    return user;
  }, { isolationLevel: 'Serializable' });
}
