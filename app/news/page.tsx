import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewsPage() {
  // Загружаем только опубликованные новости
  const news = await prisma.news.findMany({
    where: { published: true },
    include: {
      author: { select: { name: true, email: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">Новости</h1>
        <p className="text-gray-600 text-lg">
          Актуальные новости и события компании
        </p>
      </div>

      {news.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 text-lg">Пока нет новостей</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link key={item.id} href={`/news/${item.id}`} className="block">
              <Card className="flex flex-col overflow-hidden group cursor-pointer h-full transition-[transform,box-shadow] duration-500 ease-out hover:shadow-lg hover:-translate-y-1">
                {item.imageUrl && (
                  <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      unoptimized={item.imageUrl.includes('blob.vercel-storage.com')}
                      onError={(e) => {
                        console.error('Image load error:', item.imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
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
      )}
    </div>
  );
}

