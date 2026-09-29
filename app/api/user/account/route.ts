import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { rateLimit } from '@/lib/security/http-guard';
import { deleteOwnAccount, AccountDeletionError } from '@/lib/delete-own-account';

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || ![request.nextUrl.origin, new URL(process.env.NEXTAUTH_URL || request.url).origin].includes(origin))
    return NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 });
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Войдите в свой аккаунт' }, { status: 401 });
  if (!rateLimit(`delete-account:${session.user.id}`, 5, 15 * 60_000))
    return NextResponse.json({ error: 'Слишком много попыток. Повторите через 15 минут.' }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (body?.confirmation !== 'УДАЛИТЬ' || typeof body.password !== 'string' || !body.password || body.password.length > 256)
    return NextResponse.json({ error: 'Введите пароль и слово УДАЛИТЬ' }, { status: 400 });
  try {
    await deleteOwnAccount(session.user.id, body.password);
    const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    for (const cookie of request.cookies.getAll()) {
      if (/^(?:__Secure-|__Host-)?next-auth\./.test(cookie.name) || /^(?:__Secure-)?krimvk-/.test(cookie.name))
        response.cookies.set(cookie.name, '', { path: '/', maxAge: 0, httpOnly: true, secure: cookie.name.startsWith('__') || request.nextUrl.protocol === 'https:', sameSite: 'lax' });
    }
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof AccountDeletionError ? error.message : 'Не удалось удалить аккаунт. Попробуйте позже.' },
      { status: error instanceof AccountDeletionError ? error.status : 500 });
  }
}
