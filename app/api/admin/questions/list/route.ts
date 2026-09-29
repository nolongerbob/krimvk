import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    // Cursor is captured before the query; overlap covers transactions in flight.
    const cursor = new Date(Date.now() - 60_000).toISOString();
    const sinceParam = request.nextUrl.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : null;
    const page = Math.max(
      1,
      Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(request.nextUrl.searchParams.get("limit") || "50", 10) || 50
      )
    );

    if (since && !Number.isNaN(since.getTime())) {
      const questions = await prisma.question.findMany({
        where: {
          OR: [{ updatedAt: { gte: since } }, { messages: { some: { createdAt: { gte: since } } } }],
          messages: { some: { isFromAdmin: false } },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      });

      return NextResponse.json({ questions, delta: true, cursor });
    }

    const questions = await prisma.question.findMany({
      where: { messages: { some: { isFromAdmin: false } } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: limit,
      skip: (page - 1) * limit,
    });

    return NextResponse.json({ questions, page, limit, cursor });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке вопросов" },
      { status: 500 }
    );
  }
}
