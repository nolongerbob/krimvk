import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response

    const { questionId, status } = await request.json();

    if (!questionId || !status) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    // Проверяем, что статус валидный
    if (!["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Неверный статус" }, { status: 400 });
    }

    // Обновляем статус диалога
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: { status },
    });

    return NextResponse.json({ 
      success: true,
      status: updatedQuestion.status,
    });
  } catch (error) {
    console.error("Error updating question status:", error);
    return NextResponse.json(
      { error: "Ошибка при изменении статуса" },
      { status: 500 }
    );
  }
}








