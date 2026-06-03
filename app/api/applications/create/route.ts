import { NextRequest, NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api-route';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function postCreate(request: NextRequest) {
  try {
    const session = await getAppSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { serviceId, address, phone, description } = await request.json();

    if (!serviceId) {
      return NextResponse.json({ error: 'Не указана услуга' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Услуга не найдена' }, { status: 404 });
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: session.user.id,
        serviceId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        service: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingApplication) {
      return NextResponse.json(
        {
          error: 'У вас уже есть активная заявка на эту услугу',
          existingApplication: {
            id: existingApplication.id,
            status: existingApplication.status,
            createdAt: existingApplication.createdAt.toISOString(),
            serviceTitle: existingApplication.service.title,
          },
        },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        serviceId,
        address: address || null,
        phone: phone || null,
        description: description || null,
        status: 'PENDING',
      },
      include: {
        service: true,
        user: { select: { name: true, email: true } },
      },
    });

    revalidatePath('/dashboard/applications');

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating application:', error);
    }
    return NextResponse.json(
      { error: 'Ошибка при создании заявки' },
      { status: 500 }
    );
  }
}

export const POST = withApiRoute(postCreate, 'POST /api/applications/create');
