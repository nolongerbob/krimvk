import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { isYandexAuthEnabled } from '@/lib/yandex-auth';
import { YANDEX_LINK_COOKIE } from '@/lib/yandex-link';
import { rateLimit } from '@/lib/security/http-guard';

export async function POST(request: NextRequest) {
  if (!isYandexAuthEnabled()) return NextResponse.json({ error: 'Недоступно' }, { status: 404 });
  if (request.headers.get('origin') !== new URL(process.env.NEXTAUTH_URL!).origin) return NextResponse.json({ error: 'Недопустимый запрос' }, { status: 403 });
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Войдите в кабинет' }, { status: 401 });
  if (!rateLimit(`yandex-link:${session.user.id}`, 5, 60000)) return NextResponse.json({ error: 'Подождите минуту перед повтором' }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (typeof body?.password !== 'string' || body.password.length > 256) return NextResponse.json({ error: 'Введите пароль кабинета' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password || !await verifyPassword(body.password, user.password)) return NextResponse.json({ error: 'Неверный пароль кабинета' }, { status: 403 });
  const token = randomBytes(32).toString('hex');
  await prisma.verificationToken.create({ data: { identifier: `yandex-link:${user.id}`, token, expires: new Date(Date.now() + 300000) } });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(YANDEX_LINK_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: new URL(process.env.NEXTAUTH_URL!).protocol === 'https:', maxAge: 300, path: '/' });
  return response;
}
