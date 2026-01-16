import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encode } from 'next-auth/jwt';

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic';

/**
 * POST - автоматический вход после подтверждения email
 * Принимает userId и создает сессию через NextAuth (только для подтвержденных email)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID не предоставлен' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь существует и email подтвержден
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    // Создаем JWT токен в формате NextAuth
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not set');
    }

    // Создаем токен в правильном формате для NextAuth
    // Структура должна соответствовать тому, что ожидает jwt callback
    const token = await encode({
      token: {
        sub: user.id, // sub обязателен для NextAuth JWT
        id: user.id, // id используется в jwt callback
        email: user.email,
        name: user.name || null,
        role: user.role || 'USER',
      },
      secret,
      maxAge: 30 * 24 * 60 * 60, // 30 дней
    });

    // Определяем имя cookie в зависимости от окружения
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    // Устанавливаем cookie для NextAuth
    const response = NextResponse.json(
      { 
        message: 'Автоматический вход выполнен',
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role,
        } 
      },
      { status: 200 }
    );

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 дней
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auto-login error:', error);
    return NextResponse.json(
      { error: 'Ошибка при автоматическом входе' },
      { status: 500 }
    );
  }
}
