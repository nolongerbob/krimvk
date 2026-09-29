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

    const sinceParam = request.nextUrl.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : null;

    const question = await prisma.question.findFirst({
      where: { userId: session.user.id },
      include: {
        messages: since && !Number.isNaN(since.getTime())
          ? {
              where: { createdAt: { gt: since } },
              orderBy: { createdAt: "asc" },
            }
          : {
              orderBy: { createdAt: "asc" },
            },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!question) {
      return NextResponse.json({ question: null });
    }

    if (since && !Number.isNaN(since.getTime())) {
      return NextResponse.json({
        question,
        delta: true,
        messages: question.messages,
      });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке диалога" },
      { status: 500 }
    );
  }
}
