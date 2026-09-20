import { NextRequest, NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api-route';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Укажите имя').max(150, 'Имя слишком длинное')
    .refine(value => !/[\u0000-\u001f\u007f]/.test(value), 'Имя содержит недопустимые символы')
    .transform(value => value.replace(/\s+/g, ' ')).optional(),
  phone: z.string().trim().max(50, 'Телефон слишком длинный').nullable().optional(),
}).refine(value => value.name !== undefined || value.phone !== undefined, 'Нет данных для обновления');

export const dynamic = 'force-dynamic';

async function getProfile(request: NextRequest) {
  try {
    const session = await getAppSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching user profile:', error);
    }
    return NextResponse.json(
      { error: 'Ошибка при загрузке профиля' },
      { status: 500 }
    );
  }
}

export const GET = withApiRoute(getProfile, 'GET /api/user/profile');

export async function PUT(request: NextRequest) {
  try {
    const session = await getAppSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Некорректные данные' }, { status: 400 });
    }
    const { name, phone } = parsed.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating user profile:', error);
    }
    return NextResponse.json(
      { error: 'Ошибка при обновлении профиля' },
      { status: 500 }
    );
  }
}
