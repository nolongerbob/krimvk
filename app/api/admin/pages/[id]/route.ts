import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// GET - получить страницу по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { name: true, email: true } },
        parent: { select: { id: true, title: true, slug: true } },
        children: { select: { id: true, title: true, slug: true } },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
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

// PUT - обновить страницу
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Проверяем, что slug уникален (кроме текущей страницы)
    const existingPage = await prisma.page.findUnique({
      where: { slug },
    });

    if (existingPage && existingPage.id !== params.id) {
      return NextResponse.json(
        { error: "Страница с таким URL уже существует" },
        { status: 400 }
      );
    }

    // Проверяем, что не создаем циклическую зависимость
    if (parentId === params.id) {
      return NextResponse.json(
        { error: "Страница не может быть родителем самой себя" },
        { status: 400 }
      );
    }

    const page = await prisma.page.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        description: description || null,
        content: content || null,
        parentId: parentId || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        isCategory: isCategory !== undefined ? isCategory : false,
      },
      include: {
        author: { select: { name: true, email: true } },
        parent: { select: { id: true, title: true, slug: true } },
        children: { select: { id: true, title: true, slug: true } },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении страницы" },
      { status: 500 }
    );
  }
}

// DELETE - удалить страницу
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Проверяем, есть ли дочерние страницы
    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: { _count: { select: { children: true } } },
    });

    if (!page) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }

    if (page._count.children > 0) {
      return NextResponse.json(
        { error: "Нельзя удалить страницу с дочерними страницами" },
        { status: 400 }
      );
    }

    await prisma.page.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении страницы" },
      { status: 500 }
    );
  }
}

