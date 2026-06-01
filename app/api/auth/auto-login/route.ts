import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  encodeNextAuthSessionToken,
  setNextAuthSessionCookie,
} from '@/lib/next-auth-session-cookie';
import { verifyPostVerifyLoginToken } from '@/lib/post-verify-login-token';
import { rateLimit } from '@/lib/security/http-guard';

export const dynamic = 'force-dynamic';

/**
 * POST — вход после подтверждения email на устройстве регистрации.
 * Только с loginToken, выданным сервером (check-email-verified), не userId.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  if (!rateLimit(`auto-login:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Подождите минуту.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const loginToken =
      typeof body.loginToken === 'string' ? body.loginToken : null;

    if (!loginToken) {
      return NextResponse.json(
        { error: 'Токен входа не предоставлен' },
        { status: 400 }
      );
    }

    const parsed = verifyPostVerifyLoginToken(loginToken);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Недействительный или просроченный токен входа' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Email не подтвержден' },
        { status: 400 }
      );
    }

    const jwt = await encodeNextAuthSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'USER',
    });

    const response = NextResponse.json(
      {
        message: 'Автоматический вход выполнен',
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    setNextAuthSessionCookie(response, jwt);
    return response;
  } catch (error) {
    console.error('Auto-login error:', error);
    return NextResponse.json(
      { error: 'Ошибка при автоматическом входе' },
      { status: 500 }
    );
  }
}
