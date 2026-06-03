import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/get-app-session";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getAppSession(request);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Находим диалог пользователя
    const question = await prisma.question.findFirst({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ question: question || null });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке диалога" },
      { status: 500 }
    );
  }
}

