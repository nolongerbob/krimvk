import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Токен обязателен'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

// Force dynamic rendering - this route uses request.json() and database operations
export const dynamic = 'force-dynamic';

/**
 * POST - сбросить пароль по токену
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Находим токен в базе данных
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: validatedData.token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Недействительный или истекший токен восстановления пароля' },
        { status: 400 }
      );
    }

    // Проверяем, не истек ли токен (1 час)
    if (resetToken.expires < new Date()) {
      // Удаляем истекший токен
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { error: 'Токен восстановления пароля истек. Пожалуйста, запросите новое письмо.' },
        { status: 400 }
      );
    }

    // Хешируем новый пароль
    const hashedPassword = await hashPassword(validatedData.password);

    // Обновляем пароль пользователя
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
      },
    });

    // Удаляем использованный токен
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json(
      { 
        message: 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.',
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

    console.error('Error in reset-password:', error);
    
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
        error: 'Ошибка при сбросе пароля',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
