import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  author: {
    name: string | null;
    email: string;
  };
}

interface NewsSectionProps {
  news: NewsItem[];
}

export function NewsSection({ news }: NewsSectionProps) {
  // Показываем последние 6 новостей
  const displayedNews = news.slice(0, 6);

  if (news.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-semibold mb-2 tracking-tight">Новости</h2>
            <p className="text-gray-600 text-lg">Актуальные события и новости компании</p>
          </div>
          <Link
            href="/news"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            Все новости
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedNews.map((item) => (
            <Link key={item.id} href={`/news/${item.id}`} className="block">
              <Card className="flex flex-col overflow-hidden group cursor-pointer h-full transition-[transform,box-shadow] duration-500 ease-out hover:shadow-lg hover:-translate-y-1">
                {item.imageUrl && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                )}
                <CardHeader className="flex-1">
                  <CardTitle className="text-xl mb-2 line-clamp-2">{item.title}</CardTitle>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{item.author.name || item.author.email}</span>
                    </div>
                    {item.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(item.publishedAt).toLocaleDateString("ru-RU", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-gray-700 text-sm line-clamp-3 mb-4 flex-1">
                    {item.content}
                  </p>
                  <div className="text-blue-600 group-hover:text-blue-800 font-medium text-sm flex items-center gap-1 pointer-events-none">
                    Читать далее
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

