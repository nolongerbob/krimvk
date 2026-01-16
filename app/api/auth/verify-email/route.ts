import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - this route uses cookies and redirects
export const dynamic = 'force-dynamic';

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

    // Создаем сессию NextAuth для автоматического входа
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret) {
      const { encode } = await import('next-auth/jwt');
      
      // Создаем токен в правильном формате для NextAuth
      // Важно: структура должна соответствовать тому, что ожидает jwt callback в auth-config.ts
      // В jwt callback мы используем token.id, token.email, token.name, token.role
      const token = await encode({
        token: {
          sub: verificationToken.user.id, // sub обязателен для NextAuth JWT
          id: verificationToken.user.id, // id используется в jwt callback
          email: verificationToken.user.email,
          name: verificationToken.user.name || null,
          role: verificationToken.user.role || 'USER',
        },
        secret,
        maxAge: 30 * 24 * 60 * 60, // 30 дней
      });

      // Определяем имя cookie в зависимости от окружения
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieName = isProduction 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';

      // Определяем базовый URL
      const baseUrl = process.env.NEXTAUTH_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        (process.env.NODE_ENV === 'production' ? 'https://krimvk.ru' : 'http://localhost:3000');
      // Редиректим на страницу verify-email с параметром success
      const redirectUrl = new URL('/verify-email?verified=true', baseUrl);
      const response = NextResponse.redirect(redirectUrl);

      // Устанавливаем cookie для NextAuth (автоматический вход)
      // Важно: используем те же настройки, что и NextAuth по умолчанию
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 дней
        path: '/',
      });
      
      // Логируем для отладки
      if (process.env.NODE_ENV === 'development') {
        console.log('[verify-email] Cookie установлена:', {
          cookieName,
          hasToken: !!token,
          tokenLength: token?.length,
          userId: verificationToken.user.id,
          email: verificationToken.user.email,
          role: verificationToken.user.role,
        });
      }

      return response;
    }

    // Если не удалось создать сессию, возвращаем JSON (fallback)
    return NextResponse.json(
      { 
        message: 'Email успешно подтвержден',
        userId: verificationToken.userId,
        userEmail: verificationToken.user.email,
        userName: verificationToken.user.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Ошибка при подтверждении email' },
      { status: 500 }
    );
  }
}

