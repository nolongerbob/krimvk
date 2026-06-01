import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// GET - получить все статьи
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// POST - создать статью
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { title, content } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Заголовок и содержание обязательны" }, { status: 400 });
    }

    // Получаем максимальный order
    const maxOrder = await prisma.knowledgeBaseArticle.aggregate({
      _max: { order: true },
    });

    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// PUT - обновить статью
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { id, title, content, order } = body;

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (order !== undefined) updateData.order = order;

    const article = await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// DELETE - удалить статью
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    await prisma.knowledgeBaseArticle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
