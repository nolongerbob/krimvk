import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем, что пользователь - администратор
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // Загружаем все диалоги
    const questions = await prisma.question.findMany({
      include: {
        user: { select: { name: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [
        { status: "asc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке вопросов" },
      { status: 500 }
    );
  }
}

