import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginWithCredentials } from '@/lib/credentials-login';
import { setNextAuthSessionCookie } from '@/lib/next-auth-session-cookie';
import { rateLimit } from '@/lib/security/http-guard';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

/**
 * POST — вход для мобильного приложения (Bearer = NextAuth JWT).
 * Веб по-прежнему использует NextAuth Credentials на /login.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  if (!rateLimit(`mobile-login:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Подождите минуту.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = schema.parse(body);
    const result = await loginWithCredentials(email, password);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const response = NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });

    setNextAuthSessionCookie(response, result.token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Неверные данные' },
        { status: 400 }
      );
    }
    console.error('mobile-login error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка при входе' },
      { status: 500 }
    );
  }
}
