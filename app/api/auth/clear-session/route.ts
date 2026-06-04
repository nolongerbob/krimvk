import { NextResponse } from 'next/server';
import { nextAuthSessionCookieName } from '@/lib/next-auth-session-cookie';

export const dynamic = 'force-dynamic';

/** Сброс служебных cookie перед signOut (pending_verify и дубли сессии). */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === 'production';

  res.cookies.set('pending_verify', '', { maxAge: 0, path: '/' });

  const sessionNames = isProd
    ? ['__Secure-next-auth.session-token', 'next-auth.session-token']
    : ['next-auth.session-token', '__Secure-next-auth.session-token'];

  for (const name of sessionNames) {
    res.cookies.set(name, '', { maxAge: 0, path: '/' });
  }

  const csrfNames = isProd
    ? ['__Host-next-auth.csrf-token', 'next-auth.csrf-token']
    : ['next-auth.csrf-token', '__Host-next-auth.csrf-token'];

  for (const name of csrfNames) {
    res.cookies.set(name, '', { maxAge: 0, path: '/' });
  }

  // На всякий случай — имя из хелпера
  res.cookies.set(nextAuthSessionCookieName(), '', { maxAge: 0, path: '/' });

  return res;
}
