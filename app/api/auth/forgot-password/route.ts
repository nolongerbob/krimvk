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

    // Находим пользователя с обработкой ошибок
    let user;
    try {
      user = await getUserByEmail(validatedData.email);
    } catch (error: any) {
      console.error('Error getting user by email:', error);
      // Если ошибка подключения к БД, возвращаем общую ошибку
      if (error?.code === 'P1001' || error?.message?.includes('Connection')) {
        return NextResponse.json(
          { error: 'Ошибка подключения к базе данных. Попробуйте позже.' },
          { status: 500 }
        );
      }
      throw error;
    }
    
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
      const isTableMissing = error?.code === 'P2021' || 
                            error?.message?.includes('does not exist') ||
                            error?.message?.includes('password_reset_tokens');
      
      if (!isTableMissing) {
        console.error('Error deleting old reset tokens:', error);
      } else {
        console.warn('Table password_reset_tokens does not exist yet, will be created on next deploy');
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
      // Если таблица не существует, пытаемся создать её
      const isTableMissing = error?.code === 'P2021' || 
                            error?.message?.includes('does not exist') ||
                            error?.message?.includes('password_reset_tokens');
      
      if (isTableMissing) {
        console.error('PasswordResetToken table does not exist. Attempting to create...', error);
        
        // Пытаемся создать таблицу напрямую через SQL
        try {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
              "id" TEXT NOT NULL,
              "userId" TEXT NOT NULL,
              "token" TEXT NOT NULL,
              "expires" TIMESTAMP(3) NOT NULL,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
            );
          `);
          
          await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" 
            ON "password_reset_tokens"("token");
          `);
          
          // Проверяем существование внешнего ключа перед добавлением
          const fkExists = await prisma.$queryRawUnsafe(`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'password_reset_tokens_userId_fkey' 
              AND table_name = 'password_reset_tokens'
            ) as exists;
          `);
          
          if (!fkExists || !(fkExists as any[])[0]?.exists) {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "password_reset_tokens" 
              ADD CONSTRAINT "password_reset_tokens_userId_fkey" 
              FOREIGN KEY ("userId") REFERENCES "users"("id") 
              ON DELETE CASCADE ON UPDATE CASCADE;
            `);
          }
          
          // Пытаемся снова создать токен
          await prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              token,
              expires,
            },
          });
          
          console.log('✅ Table password_reset_tokens created and token saved');
        } catch (createError: any) {
          console.error('Failed to create table:', createError);
          return NextResponse.json(
            { 
              error: 'Таблица для восстановления пароля не создана. Пожалуйста, выполните миграцию базы данных.',
              hint: 'На Vercel миграции должны применяться автоматически при следующем деплое.'
            },
            { status: 500 }
          );
        }
      } else {
        throw error;
      }
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
