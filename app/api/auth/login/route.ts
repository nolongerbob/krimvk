import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginWithCredentials } from '@/lib/credentials-login';
import { setNextAuthSessionCookie } from '@/lib/next-auth-session-cookie';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * @deprecated Веб: NextAuth на /login. Предпочтительно: POST /api/auth/mobile-login.
 * Ответ совместим с Android (`success`, `token`, `user`).
 */
export async function POST(request: NextRequest) {
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
      message: 'Успешный вход',
    });

    setNextAuthSessionCookie(response, result.token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ошибка при входе' }, { status: 500 });
  }
}
