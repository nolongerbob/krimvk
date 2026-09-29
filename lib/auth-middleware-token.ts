import type { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';
import { getToken } from 'next-auth/jwt';

/** JWT из cookie NextAuth или Bearer (мобильное приложение). */
export async function getAuthJwtFromRequest(req: NextRequest) {
  // Match NextAuth's cookie selection, including HTTPS development origins.
  const secureCookie = process.env.NEXTAUTH_URL?.startsWith('https://') ?? !!process.env.VERCEL;
  const cookieToken = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
    cookieName: secureCookie
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
  });
  if (cookieToken) {
    return cookieToken;
  }

  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const raw = header.slice(7).trim();
  const secret = process.env.NEXTAUTH_SECRET;
  if (!raw || !secret) {
    return null;
  }

  try {
    const payload = await decode({ token: raw, secret });
    if (!payload || (!payload.sub && !(payload as Record<string, unknown>).id)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
