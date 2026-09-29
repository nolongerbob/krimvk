import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { getAppSession } from '@/lib/get-app-session';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/resend';
import { rateLimit } from '@/lib/security/http-guard';
import { completeSocialRegistration, readSocialDraft, SOCIAL_REG_COOKIE, socialCookieOptions } from '@/lib/social-registration';

export const dynamic = 'force-dynamic';
const schema = z.object({ email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), name: z.string().trim().min(1).max(200), phone: z.string().trim().max(40).optional(), password: z.string().min(6).max(128) });
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SOCIAL_REG_COOKIE)?.value;
  if (!cookie) return new NextResponse(null, { status: 204, headers });
  const draft = await readSocialDraft(cookie);
  if (!draft) return NextResponse.json({ error: 'Подтверждение истекло. Войдите через сервис ещё раз.' }, { status: 410, headers });
  const existing = draft.email ? await prisma.user.findFirst({ where: { email: { equals: draft.email, mode: 'insensitive' } }, select: { id: true } }) : null;
  return NextResponse.json({ provider: draft.provider, name: draft.name, email: draft.email, phone: draft.phone, emailExists: !!existing }, { headers });
}
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== process.env.NEXTAUTH_URL) return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403, headers });
  if (await getAppSession(request)) return NextResponse.json({ error: 'Вы уже вошли. Привяжите сервис в настройках кабинета.' }, { status: 409, headers });
  const draft = await readSocialDraft(request.cookies.get(SOCIAL_REG_COOKIE)?.value);
  if (!draft) return NextResponse.json({ error: 'Подтверждение истекло. Войдите через сервис ещё раз.' }, { status: 410, headers });
  if (!rateLimit('social-register:' + draft.nonce, 5, 60000)) return NextResponse.json({ error: 'Подождите минуту.' }, { status: 429, headers });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Проверьте ФИО, email и пароль (6–128 символов).' }, { status: 400, headers });
  try {
    const user = await completeSocialRegistration(draft, { ...parsed.data, password: await hashPassword(parsed.data.password) });
    // An edited address is never considered verified solely because OAuth succeeded.
    let emailSent = false;
    try {
      const token = randomBytes(32).toString('hex');
      await prisma.emailVerificationToken.create({ data: { userId: user.id, token, expires: new Date(Date.now() + 86400000) } });
      await sendVerificationEmail(user.email, token, user.name || undefined);
      emailSent = true;
    } catch { /* The user can request verification again from their cabinet. */ }
    const maxAge = 30 * 86400;
    const session = await encode({ secret: process.env.NEXTAUTH_SECRET!, maxAge, token: { sub: user.id, id: user.id, email: user.email, name: user.name, role: user.role } });
    const secure = !!process.env.NEXTAUTH_URL?.startsWith('https:');
    const response = NextResponse.json({ registered: true, linked: true, emailSent }, { status: 201, headers });
    response.cookies.set(SOCIAL_REG_COOKIE, '', { ...socialCookieOptions(), maxAge: 0 });
    response.cookies.set(secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', session, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge });
    response.cookies.set('pending_verify', user.id, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 86400 });
    return response;
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const message = reason === 'EMAIL_EXISTS' ? 'Пользователь с этим email уже существует. Войдите в него и привяжите сервис в настройках.' : reason === 'IDENTITY_EXISTS' ? 'Этот сервис уже привязан к кабинету. Вернитесь ко входу.' : reason === 'EXPIRED' ? 'Подтверждение уже использовано или истекло. Начните вход заново.' : 'Не удалось завершить регистрацию. Повторите попытку или войдите, если кабинет уже создан.';
    return NextResponse.json({ error: message, code: reason === 'EMAIL_EXISTS' ? 'EMAIL_EXISTS' : undefined }, { status: 409, headers });
  }
}
