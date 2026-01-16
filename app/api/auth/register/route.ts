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
    try {
      console.log('Sending verification email to:', user.email);
      const emailResult = await sendVerificationEmail(user.email, token, user.name || undefined);
      console.log('Verification email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Не прерываем регистрацию, если email не отправился
      // Пользователь сможет запросить повторную отправку позже
    }

    return NextResponse.json(
      { 
        message: 'Регистрация успешна. Пожалуйста, проверьте вашу почту для подтверждения email.',
        userId: user.id,
        emailSent: true,
      },
      { status: 201 }
    );
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


