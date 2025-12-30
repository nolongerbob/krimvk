import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

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

    const news = await prisma.news.findUnique({
      where: { id: params.id },
    });

    if (!news) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    return NextResponse.json({ news });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке новости" },
      { status: 500 }
    );
  }
}

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

    const { title, content, imageUrl, published } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const existingNews = await prisma.news.findUnique({
      where: { id: params.id },
    });

    if (!existingNews) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    // Обновляем новость
    const news = await prisma.news.update({
      where: { id: params.id },
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        published: published || false,
        publishedAt: published && !existingNews.publishedAt ? new Date() : existingNews.publishedAt,
      },
    });

    return NextResponse.json({ success: true, news });
  } catch (error) {
    console.error("Error updating news:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении новости" },
      { status: 500 }
    );
  }
}






