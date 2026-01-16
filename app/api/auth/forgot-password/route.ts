import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/resend';
import { getUserByEmail } from '@/lib/auth';
import crypto from 'crypto';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Некорректный email'),
});

// Force dynamic rendering - this route uses request.json() and database operations
export const dynamic = 'force-dynamic';

/**
 * POST - запросить восстановление пароля
 * Отправляет письмо с ссылкой для сброса пароля
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Находим пользователя
    const user = await getUserByEmail(validatedData.email);
    
    // Всегда возвращаем успех, даже если пользователь не найден
    // Это предотвращает перебор email адресов
    if (!user) {
      return NextResponse.json(
        { 
          message: 'Если указанный email существует в системе, на него будет отправлено письмо с инструкциями по восстановлению пароля.' 
        },
        { status: 200 }
      );
    }

    // Проверяем, что у пользователя есть пароль (не OAuth пользователь)
    if (!user.password) {
      return NextResponse.json(
        { 
          message: 'Если указанный email существует в системе, на него будет отправлено письмо с инструкциями по восстановлению пароля.' 
        },
        { status: 200 }
      );
    }

    // Удаляем старые токены восстановления для этого пользователя
    try {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
    } catch (error: any) {
      // Игнорируем ошибку, если таблица еще не создана
      if (error?.code !== 'P2021' && !error?.message?.includes('does not exist')) {
        console.error('Error deleting old reset tokens:', error);
      }
    }

    // Генерируем новый токен
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Токен действителен 1 час

    // Сохраняем токен в базе данных
    try {
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expires,
        },
      });
    } catch (error: any) {
      // Если таблица не существует, нужно применить миграцию
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        console.error('PasswordResetToken table does not exist. Error:', error);
        // В production на Vercel миграции должны применяться автоматически через vercel-build
        // Если таблица все еще не существует, возможно нужно вручную выполнить миграцию
        return NextResponse.json(
          { 
            error: 'Таблица для восстановления пароля не создана. Пожалуйста, выполните миграцию базы данных или обратитесь к администратору.',
            hint: 'На Vercel миграции должны применяться автоматически. Проверьте логи сборки.'
          },
          { status: 500 }
        );
      }
      throw error;
    }

    // Отправляем письмо с инструкциями
    try {
      await sendPasswordResetEmail(user.email, token, user.name || undefined);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Удаляем токен, если не удалось отправить письмо
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      
      return NextResponse.json(
        { 
          error: 'Ошибка при отправке письма. Попробуйте позже.' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Если указанный email существует в системе, на него будет отправлено письмо с инструкциями по восстановлению пароля.' 
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error in forgot-password:', error);
    
    // Проверяем, не связана ли ошибка с отсутствием таблицы
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('password_reset_tokens') || errorMessage.includes('PasswordResetToken') || errorMessage.includes('P2021')) {
      console.error('PasswordResetToken table does not exist. Please run: npx prisma db push');
      return NextResponse.json(
        { 
          error: 'Таблица для восстановления пароля не создана. Пожалуйста, выполните: npx prisma db push',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Ошибка при обработке запроса',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
