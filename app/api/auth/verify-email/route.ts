import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json(
        { error: 'Недействительный токен подтверждения' },
        { status: 400 }
      );
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

    return NextResponse.json(
      { 
        message: 'Email успешно подтвержден',
        userId: verificationToken.userId,
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

