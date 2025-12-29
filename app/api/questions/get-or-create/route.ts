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

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Находим или создаем диалог для пользователя
    let question = await prisma.question.findFirst({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Если диалога нет, создаем новый
    if (!question) {
      question = await prisma.question.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
          user: { select: { name: true, email: true } },
        },
      });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error getting or creating question:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке диалога" },
      { status: 500 }
    );
  }
}

