import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";

// GET - получить пост по ID
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

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        page: { select: { id: true, title: true, slug: true } },
        author: { select: { name: true, email: true } },
        attachments: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке поста" },
      { status: 500 }
    );
  }
}

// PUT - обновить пост
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

    const { pageId, title, content } = await request.json();

    if (!pageId || !title || !content) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // Получаем текущий пост
    const currentPost = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!currentPost) {
      return NextResponse.json(
        { error: "Пост не найден" },
        { status: 404 }
      );
    }

    // Если заголовок изменился, обновляем slug
    let slug = currentPost.slug;
    if (title !== currentPost.title) {
      const existingPosts = await prisma.post.findMany({
        where: { id: { not: params.id } },
        select: { slug: true },
      });
      const existingSlugs = existingPosts.map(p => p.slug);
      slug = generateSlug(title, existingSlugs);
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        pageId,
        title,
        slug,
        content,
      },
      include: {
        page: { select: { id: true, title: true, slug: true } },
        author: { select: { name: true, email: true } },
        attachments: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении поста" },
      { status: 500 }
    );
  }
}

// DELETE - удалить пост
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

    await prisma.post.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении поста" },
      { status: 500 }
    );
  }
}

