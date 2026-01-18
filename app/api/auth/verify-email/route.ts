import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - this route uses cookies and redirects
export const dynamic = 'force-dynamic';

function clearPendingVerify(res: NextResponse) {
  res.cookies.set('pending_verify', '', { maxAge: 0, path: '/' });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Токен подтверждения не предоставлен' },
      { status: 400 }
    );
  }

  try {
    // Находим токен в базе данных
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      // Токен не найден - возможно уже использован (email уже подтвержден)
      // Редиректим на страницу verify-email с параметром already=true
      // Там покажем сообщение, что email уже подтвержден
      // Определяем базовый URL
      const baseUrl = process.env.NEXTAUTH_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        (process.env.NODE_ENV === 'production' ? 'https://krimvk.ru' : 'http://localhost:3000');
      const redirectUrl = new URL('/verify-email?already=true', baseUrl);
      return NextResponse.redirect(redirectUrl);
    }

    // Проверяем, не истек ли токен (24 часа)
    if (verificationToken.expires < new Date()) {
      // Удаляем истекший токен
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        { error: 'Токен подтверждения истек. Пожалуйста, запросите новое письмо.' },
        { status: 400 }
      );
    }

    // Обновляем пользователя - помечаем email как подтвержденный
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date(),
      },
    });

    // Удаляем использованный токен
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      (process.env.NODE_ENV === 'production' ? 'https://krimvk.ru' : 'http://localhost:3000');

    const cookieStore = await cookies();
    const pendingVerify = cookieStore.get('pending_verify')?.value;
    const session = await getServerSession(authOptions);
    // Устройство, где регистрировался: есть cookie pending_verify=userId
    const isRegistrationDevice = pendingVerify === verificationToken.userId;
    // Тот же браузер, уже был вход (например, повторная отправка из ЛК): есть сессия этого пользователя
    const isSameDeviceWithSession = session?.user?.id === verificationToken.userId;

    const shouldRedirectToLk = (isRegistrationDevice || isSameDeviceWithSession) && process.env.NEXTAUTH_SECRET;

    if (shouldRedirectToLk) {
      const { encode } = await import('next-auth/jwt');
      const jwt = await encode({
        token: {
          sub: verificationToken.user.id,
          id: verificationToken.user.id,
          email: verificationToken.user.email,
          name: verificationToken.user.name || null,
          role: verificationToken.user.role || 'USER',
        },
        secret: process.env.NEXTAUTH_SECRET,
        maxAge: 30 * 24 * 60 * 60,
      });

      const isProduction = process.env.NODE_ENV === 'production';
      const cookieName = isProduction 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token';

      const response = NextResponse.redirect(new URL('/verify-email?verified=true', baseUrl));
      response.cookies.set(cookieName, jwt, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
      clearPendingVerify(response);
      return response;
    }

    // Подтверждение с другого устройства: не логиним, не редиректим в ЛК
    const response = NextResponse.redirect(new URL('/verify-email?verified=true&from=other', baseUrl));
    clearPendingVerify(response);
    return response;
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Ошибка при подтверждении email' },
      { status: 500 }
    );
  }
}

