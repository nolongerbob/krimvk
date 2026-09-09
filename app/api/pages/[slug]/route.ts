import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - получить страницу по slug (публичный доступ)
export async function GET(
  request: NextRequest,
  { params: routeParams }: { params: Promise<{ slug: string }> }
) {
  const params = await routeParams;
  try {
    const page = await prisma.page.findUnique({
      where: { 
        slug: params.slug,
        isActive: true, // Только активные страницы
      },
      include: {
        author: { select: { name: true } },
        parent: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке страницы" },
      { status: 500 }
    );
  }
}








