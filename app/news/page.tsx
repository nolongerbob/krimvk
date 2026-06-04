import { prisma, withRetry } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { NewsCard } from "@/components/NewsCard";

export const revalidate = 120;

export default async function NewsPage() {
  let news: Array<{
    id: string;
    title: string;
    content: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    author: {
      name: string | null;
      email: string;
    };
  }> = [];

  try {
    news = await withRetry(() =>
      prisma.news.findMany({
        where: { published: true },
        include: {
          author: { select: { name: true, email: true } },
        },
        orderBy: { publishedAt: "desc" },
      })
    ).catch((error) => {
      console.error("Error loading news:", error);
      return [];
    }) as typeof news;
  } catch (error) {
    console.error("Error loading news:", error);
    news = [];
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-gray-50 py-12 md:py-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container mx-auto flex flex-1 flex-col px-4">
        <div className="mb-8 shrink-0 animate-fade-in md:mb-10">
          <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">Новости</h1>
          <p className="text-base text-gray-600 md:text-lg">
            Актуальные новости и события компании
          </p>
        </div>

        {news.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-6 md:py-10">
            <Card className="w-full max-w-xl rounded-none border bg-white shadow-none">
              <CardContent className="flex flex-col items-center px-8 py-14 text-center md:px-10 md:py-16">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-md bg-cyan-100">
                  <Newspaper className="h-7 w-7 text-cyan-600" />
                </div>
                <p className="mb-2 text-xl font-semibold text-gray-900">Пока нет новостей</p>
                <p className="mb-8 max-w-sm text-base text-gray-600">
                  Мы готовим материалы — загляните позже или воспользуйтесь другими разделами сайта
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button asChild className="rounded-none hover:scale-100 active:scale-100">
                    <Link href="/">Перейти на главную</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-none hover:scale-100 active:scale-100">
                    <Link href="/services">Посмотреть услуги</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {news.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
