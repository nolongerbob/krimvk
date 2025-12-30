import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get("id");

    if (!applicationId) {
      return NextResponse.json({ error: "ID заявки не указан" }, { status: 400 });
    }

    // Получаем данные заявки из базы
    const { prisma } = await import("@/lib/prisma");
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    // Проверяем права доступа
    if (application.userId !== session.user.id) {
      // Проверяем, является ли пользователь администратором
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
      }
    }

    // Парсим данные заявки
    let formData: any = {};
    try {
      if (application.description) {
        const parsed = JSON.parse(application.description);
        if (parsed.type === "technical_conditions") {
          formData = parsed;
        } else {
          return NextResponse.json({ error: "Это не заявка на технические условия" }, { status: 400 });
        }
      }
    } catch (e) {
      return NextResponse.json({ error: "Ошибка при парсинге данных заявки" }, { status: 500 });
    }

    // Возвращаем данные для генерации PDF на клиенте
    return NextResponse.json({ formData, applicationId: application.id });
  } catch (error) {
    console.error("Error getting application data:", error);
    return NextResponse.json(
      { error: "Ошибка при получении данных заявки" },
      { status: 500 }
    );
  }
}


