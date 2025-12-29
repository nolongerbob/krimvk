import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";

// GET - получить все посты
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    const where = pageId ? { pageId } : {};

    const posts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        createdAt: true,
        page: { select: { id: true, title: true, slug: true } },
        author: { select: { name: true, email: true } },
        _count: { select: { attachments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке постов" },
      { status: 500 }
    );
  }
}

// POST - создать новый пост
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { pageId, title, content } = await request.json();

    if (!pageId || !title || !content) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // Проверяем, что раздел существует и является категорией
    const page = await prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      return NextResponse.json(
        { error: "Раздел не найден" },
        { status: 404 }
      );
    }

    if (!page.isCategory) {
      return NextResponse.json(
        { error: "Выбранный раздел не является категорией для постов" },
        { status: 400 }
      );
    }

    // Получаем все существующие slug для проверки уникальности
    const existingPosts = await prisma.post.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingPosts.map(p => p.slug);

    // Генерируем уникальный slug из заголовка
    const slug = generateSlug(title, existingSlugs);

    const post = await prisma.post.create({
      data: {
        pageId,
        title,
        slug,
        content,
        authorId: session.user.id,
      },
      include: {
        page: { select: { id: true, title: true, slug: true } },
        author: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Ошибка при создании поста" },
      { status: 500 }
    );
  }
}

