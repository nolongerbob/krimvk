import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * POST - отменить заявку пользователем
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: "Не указан ID заявки" }, { status: 400 });
    }

    // Проверяем, что заявка принадлежит пользователю и имеет статус PENDING
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id,
        status: "PENDING", // Можно отменить только ожидающие заявки
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Заявка не найдена или её нельзя отменить" },
        { status: 404 }
      );
    }

    // Обновляем статус заявки
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: "CANCELLED" },
      include: { service: true },
    });

    // Обновляем кэш страницы заявок
    revalidatePath("/dashboard/applications");

    return NextResponse.json({
      success: true,
      application: updatedApplication,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error cancelling application:", error);
    }
    return NextResponse.json(
      { error: "Ошибка при отмене заявки" },
      { status: 500 }
    );
  }
}

