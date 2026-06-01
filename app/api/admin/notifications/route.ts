import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma, withRetry } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

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

