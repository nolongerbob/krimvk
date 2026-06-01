import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** JWT из cookie NextAuth в middleware (имя cookie в production — __Secure-...). */
export async function getAuthJwtFromRequest(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  return getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: isProd,
    cookieName: isProd
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
  });
}
