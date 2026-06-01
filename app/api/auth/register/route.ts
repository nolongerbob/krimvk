import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/resend';
import { z } from 'zod';
import crypto from 'crypto';

// Force dynamic rendering - this route uses cookies and database operations
export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  name: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Проверяем, существует ли пользователь
    let existingUser;
    try {
      existingUser = await getUserByEmail(validatedData.email);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: 'Ошибка подключения к базе данных. Проверьте настройки DATABASE_URL в .env файле.',
          details: process.env.NODE_ENV === 'development' 
            ? (dbError instanceof Error ? dbError.message : String(dbError))
            : undefined
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Создаем пользователя (email еще не подтвержден)
    const user = await createUser(validatedData);

    // Генерируем токен подтверждения
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Токен действителен 24 часа

    // Сохраняем токен в базе данных
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // Отправляем email с подтверждением
    let emailSent = false;
    try {
      await sendVerificationEmail(user.email, token, user.name || undefined);
      emailSent = true;
    } catch (emailError) {
      console.error('[register] Не удалось отправить письмо:', (emailError as Error)?.message ?? emailError);
      // Не прерываем регистрацию — пользователь сможет запросить повторную отправку в ЛК
    }

    // Создаём сессию NextAuth для автоматического входа сразу после регистрации
    let sessionCookie: string | null = null;
    if (process.env.NEXTAUTH_SECRET) {
      const { encode } = await import('next-auth/jwt');
      sessionCookie = await encode({
        token: {
          sub: user.id,
          id: user.id,
          email: user.email,
          name: user.name || null,
          role: user.role || 'USER',
        },
        secret: process.env.NEXTAUTH_SECRET,
        maxAge: 30 * 24 * 60 * 60, // 30 дней
      });
    }

    const res = NextResponse.json(
      {
        message: emailSent
          ? 'Регистрация успешна. Пожалуйста, проверьте вашу почту для подтверждения email.'
          : 'Регистрация успешна. Письмо с подтверждением не удалось отправить — запросите повторную отправку в личном кабинете.',
        emailSent,
      },
      { status: 201 }
    );

    // Cookie для определения устройства регистрации (для автовхода после подтверждения)
    res.cookies.set('pending_verify', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 ч
      path: '/',
    });

    // Создаём сессию NextAuth для автоматического входа
    if (sessionCookie) {
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieName = isProduction 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token';
      res.cookies.set(cookieName, sessionCookie, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 дней
        path: '/',
      });
    }

    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    
    // Более детальная информация об ошибке
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ошибка при регистрации';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}


