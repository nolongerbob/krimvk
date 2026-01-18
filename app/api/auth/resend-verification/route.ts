import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/resend';
import crypto from 'crypto';

// Force dynamic rendering - this route uses headers() via getServerSession
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('[resend-verification] Начало запроса');
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      console.log('[resend-verification] Пользователь не авторизован');
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    console.log('[resend-verification] Пользователь авторизован:', session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      console.log('[resend-verification] Пользователь не найден в БД');
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    console.log('[resend-verification] Пользователь найден, email:', user.email, 'emailVerified:', user.emailVerified);
    
    if (user.emailVerified) {
      console.log('[resend-verification] Email уже подтвержден');
      return NextResponse.json(
        { error: 'Email уже подтвержден' },
        { status: 400 }
      );
    }

    // Удаляем старый токен, если есть
    console.log('[resend-verification] Удаление старых токенов');
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Генерируем новый токен
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Токен действителен 24 часа

    console.log('[resend-verification] Создание нового токена');
    // Сохраняем новый токен
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    console.log('[resend-verification] Отправка письма на:', user.email);
    // Отправляем email
    const emailResult = await sendVerificationEmail(user.email, token, user.name || undefined);
    console.log('[resend-verification] Письмо отправлено успешно:', emailResult);

    return NextResponse.json(
      { message: 'Письмо с подтверждением отправлено на ваш email' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[resend-verification] Ошибка:', error?.message ?? error);
    return NextResponse.json(
      { 
        error: error?.message || 'Ошибка при отправке письма',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

