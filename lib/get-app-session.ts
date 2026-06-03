import type { NextRequest } from 'next/server';
import { getServerSession, type Session } from 'next-auth';
import { decode } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth-config';

function sessionFromJwt(payload: Record<string, unknown>): Session {
  const id = (payload.id as string) || (payload.sub as string);
  return {
    user: {
      id,
      email: (payload.email as string) || '',
      name: (payload.name as string) || null,
      role: (payload.role as string) || 'USER',
    },
    expires: payload.exp
      ? new Date((payload.exp as number) * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Сессия из cookie NextAuth или Bearer (мобильное приложение).
 */
export async function getAppSession(
  request?: NextRequest
): Promise<Session | null> {
  const cookieSession = await getServerSession(authOptions);
  if (cookieSession?.user?.id) {
    return cookieSession;
  }

  if (!request) {
    return null;
  }

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const raw = header.slice(7).trim();
  if (!raw) {
    return null;
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const payload = await decode({ token: raw, secret });
    if (!payload || (!payload.sub && !payload.id)) {
      return null;
    }
    return sessionFromJwt(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}
