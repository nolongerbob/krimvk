import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma, withRetry } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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

    // Простые запросы с обработкой ошибок и переподключением
    const [newApplications, newQuestions, inProgressQuestions] = await Promise.all([
      withRetry(() => prisma.application.count({ where: { status: "PENDING" } })).catch(() => 0),
      withRetry(() => prisma.question.count({ where: { status: "PENDING" } })).catch(() => 0),
      withRetry(() => prisma.question.count({ where: { status: "IN_PROGRESS" } })).catch(() => 0),
    ]);

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

