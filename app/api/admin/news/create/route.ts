import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем, что пользователь - администратор
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

    // Создаем новость
    const news = await prisma.news.create({
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        authorId: session.user.id,
        published: published || false,
        publishedAt: published ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, news });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json(
      { error: "Ошибка при создании новости" },
      { status: 500 }
    );
  }
}

