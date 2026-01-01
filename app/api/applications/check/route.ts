import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

/**
 * GET - проверить наличие активной заявки на услугу
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "Не указана услуга" }, { status: 400 });
    }

    // Проверяем наличие активной заявки
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId: session.user.id,
        serviceId: serviceId,
        status: {
          in: ["PENDING", "IN_PROGRESS"], // Активные статусы
        },
      },
      include: {
        service: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      hasActiveApplication: !!existingApplication,
      existingApplication: existingApplication
        ? {
            id: existingApplication.id,
            status: existingApplication.status,
            createdAt: existingApplication.createdAt.toISOString(),
            serviceTitle: existingApplication.service.title,
          }
        : null,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error checking application:", error);
    }
    return NextResponse.json(
      { error: "Ошибка при проверке заявки" },
      { status: 500 }
    );
  }
}




