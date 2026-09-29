import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPublicAuthorName } from "@/lib/format-public-author";

export const revalidate = 300;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.news.findUnique({
      where: { id, published: true },
      include: {
        author: { select: { name: true, email: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Новость не найдена" }, { status: 404 });
    }

    return NextResponse.json({
      news: {
        id: item.id,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt?.toISOString() ?? null,
        authorName: formatPublicAuthorName(item.author.name, item.author.email),
      },
    });
  } catch (error) {
    console.error("Error fetching news item:", error);
    return NextResponse.json({ error: "Ошибка загрузки новости" }, { status: 500 });
  }
}
