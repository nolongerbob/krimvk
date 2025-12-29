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

    // Используем роль из сессии (уже проверена при логине)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // Считаем новые заявки (PENDING)
    const newApplications = await prisma.application.count({
      where: { status: "PENDING" },
    });

    // Считаем новые вопросы (PENDING)
    const newQuestions = await prisma.question.count({
      where: { status: "PENDING" },
    });

    // Считаем вопросы в работе (IN_PROGRESS)
    const inProgressQuestions = await prisma.question.count({
      where: { status: "IN_PROGRESS" },
    });

    return NextResponse.json({
      newApplications,
      newQuestions,
      inProgressQuestions,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке уведомлений" },
      { status: 500 }
    );
  }
}

