import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// GET - получить все страницы
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

    const pages = await prisma.page.findMany({
      include: {
        author: { select: { name: true, email: true } },
        parent: { select: { id: true, title: true, slug: true } },
        _count: { select: { children: true, posts: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке страниц" },
      { status: 500 }
    );
  }
}

// POST - создать новую страницу
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

    const { title, slug, description, content, parentId, order, isActive, isCategory } = await request.json();

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // Если это категория, content не обязателен
    if (!isCategory && !content) {
      return NextResponse.json(
        { error: "Заполните содержимое страницы" },
        { status: 400 }
      );
    }

    // Проверяем, что slug уникален
    const existingPage = await prisma.page.findUnique({
      where: { slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "Страница с таким URL уже существует" },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        description: description || null,
        content: content || null,
        parentId: parentId || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        isCategory: isCategory || false,
        authorId: session.user.id,
      },
      include: {
        author: { select: { name: true, email: true } },
        parent: { select: { id: true, title: true, slug: true } },
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Ошибка при создании страницы" },
      { status: 500 }
    );
  }
}

