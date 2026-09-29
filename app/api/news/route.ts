import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { formatPublicAuthorName } from "@/lib/format-public-author";

export const revalidate = 120;

export async function GET() {
  try {
    const items = await withRetry(() =>
      prisma.news.findMany({
        where: { published: true },
        include: {
          author: { select: { name: true, email: true } },
        },
        orderBy: { publishedAt: "desc" },
      })
    );

    return NextResponse.json({
      news: items.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt?.toISOString() ?? null,
        authorName: formatPublicAuthorName(item.author.name, item.author.email),
      })),
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Ошибка загрузки новостей" }, { status: 500 });
  }
}
