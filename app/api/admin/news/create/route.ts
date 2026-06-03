import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response

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
        authorId: auth.admin.userId,
        published: published || false,
        publishedAt: published ? new Date() : null,
      },
    });

    if (published) {
      revalidatePath("/");
      revalidatePath("/news");
    }

    return NextResponse.json({ success: true, news });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json(
      { error: "Ошибка при создании новости" },
      { status: 500 }
    );
  }
}

