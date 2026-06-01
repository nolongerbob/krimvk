import { encode } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export function nextAuthSessionCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';
}

export async function encodeNextAuthSessionToken(user: SessionUser): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set');
  }

  return encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'USER',
    },
    secret,
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function setNextAuthSessionCookie(response: NextResponse, jwt: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(nextAuthSessionCookieName(), jwt, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
}
