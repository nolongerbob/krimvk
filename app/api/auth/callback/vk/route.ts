import { NextRequest, NextResponse } from 'next/server';
import { decode, encode } from 'next-auth/jwt';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { exchangeVkProfile, hashVkState, isVkAuthEnabled, sameVkState, VK_FLOW_COOKIE } from '@/lib/vk-auth';
import { createSocialDraft, SOCIAL_REG_COOKIE, socialCookieOptions } from '@/lib/social-registration';

export const dynamic = 'force-dynamic';
function finish(path: string) {
  const response = NextResponse.redirect(new URL(path, 'https://dev.krimvk.ru'));
  response.cookies.set(VK_FLOW_COOKIE, '', { secure: true, httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
export async function GET(request: NextRequest) {
  if (!isVkAuthEnabled()) return NextResponse.json({ error: 'Недоступно' }, { status: 404 });
  let linking = false;
  try {
    const flow = await decode({ token: request.cookies.get(VK_FLOW_COOKIE)?.value, secret: process.env.NEXTAUTH_SECRET! });
    const state = request.nextUrl.searchParams.get('state');
    if (!flow || flow.purpose !== 'vk-oauth' || !sameVkState(flow.state, state)
      || typeof flow.verifier !== 'string' || !['link', 'login'].includes(String(flow.mode))) return finish('/login?error=VkExpired');
    linking = flow.mode === 'link';
    const used = await prisma.verificationToken.deleteMany({ where: { identifier: 'vk-oauth', token: hashVkState(state!), expires: { gt: new Date() } } });
    if (used.count !== 1) return finish('/login?error=VkExpired');
    if (request.nextUrl.searchParams.has('error')) return finish(linking ? '/dashboard/settings?vk=cancelled' : '/login?error=VkCancelled');
    const code = request.nextUrl.searchParams.get('code');
    const deviceId = request.nextUrl.searchParams.get('device_id');
    if (!code || !deviceId || code.length > 4096 || deviceId.length > 4096) throw new Error('Invalid callback');
    const session = await getAppSession(request);
    if (linking && (!session?.user?.id || session.user.id !== flow.userId)) return finish('/login?error=VkExpired');
    const profile = await exchangeVkProfile(code, deviceId, flow.verifier, state!);
    const externalId = profile.id;
    if (linking) {
      const outcome = await prisma.$transaction(async tx => {
        const existing = await tx.account.findUnique({ where: { provider_providerAccountId: { provider: 'vk', providerAccountId: externalId } } });
        if (existing) return existing.userId === flow.userId;
        const other = await tx.account.findFirst({ where: { userId: String(flow.userId), provider: 'vk' } });
        if (other) return false;
        await tx.account.create({ data: { userId: String(flow.userId), type: 'oauth', provider: 'vk', providerAccountId: externalId } });
        return true;
      }, { isolationLevel: 'Serializable' });
      return finish(outcome ? '/dashboard/settings?vk=linked' : '/dashboard/settings?vk=conflict');
    }
    const account = await prisma.account.findUnique({ where: { provider_providerAccountId: { provider: 'vk', providerAccountId: externalId } }, include: { user: true } });
    if (!account) {
      if (session?.user?.id) return finish('/dashboard/settings?vk=needs-link');
      const draft = await createSocialDraft('vk', externalId, profile);
      const response = finish('/register?social=1');
      response.cookies.set(SOCIAL_REG_COOKIE, draft, socialCookieOptions());
      return response;
    }
    // An already signed-in tab must not silently switch to someone else's cabinet.
    if (session?.user?.id && session.user.id !== account.userId) return finish('/login?error=VkSessionConflict');
    const user = account.user;
    const maxAge = 30 * 24 * 60 * 60;
    const token = await encode({ secret: process.env.NEXTAUTH_SECRET!, maxAge,
      token: { sub: user.id, id: user.id, name: user.name, email: user.email, role: user.role } });
    const response = finish('/dashboard');
    // Clear old chunks before replacing the NextAuth JWT session.
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith('__Secure-next-auth.session-token.')) response.cookies.set(cookie.name, '', { secure: true, httpOnly: true, path: '/', maxAge: 0 });
    }
    response.cookies.set('__Secure-next-auth.session-token', token, { secure: true, httpOnly: true, sameSite: 'lax', path: '/', maxAge });
    return response;
  } catch {
    // Never log callback codes, provider tokens or raw response bodies.
    return finish(linking ? '/dashboard/settings?vk=failed' : '/login?error=VkFailed');
  }
}
