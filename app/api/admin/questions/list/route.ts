import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response

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

