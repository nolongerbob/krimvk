import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/resend';
import { getUserByEmail } from '@/lib/auth';
import crypto from 'crypto';
import { z } from 'zod';

const changeEmailSchema = z.object({
  newEmail: z.string().email('Некорректный email'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = changeEmailSchema.parse(body);

    // Проверяем, не занят ли новый email
    const existingUser = await getUserByEmail(validatedData.newEmail);
    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Email уже используется другим пользователем' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Обновляем email и сбрасываем подтверждение
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: validatedData.newEmail,
        emailVerified: null,
      },
    });

    // Удаляем старые токены
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Генерируем новый токен для нового email
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // Отправляем письмо на новый email
    await sendVerificationEmail(validatedData.newEmail, token, user.name || undefined);

    return NextResponse.json(
      { 
        message: 'Email изменен. Письмо с подтверждением отправлено на новый адрес.',
        newEmail: validatedData.newEmail,
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

    console.error('Error changing email:', error);
    return NextResponse.json(
      { error: 'Ошибка при изменении email' },
      { status: 500 }
    );
  }
}

