import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function NewsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const news = await prisma.news.findUnique({
    where: { 
      id: params.id,
      published: true, // Только опубликованные новости
    },
    include: {
      author: { select: { name: true, email: true } },
    },
  });

  if (!news) {
    notFound();
  }

  return (
    <div className="container py-8 px-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/news">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к новостям
          </Link>
        </Button>
      </div>

      <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Заголовок и метаданные */}
        <div className="px-6 md:px-8 pt-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {news.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{news.author.name || news.author.email}</span>
            </div>
            {news.publishedAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(news.publishedAt).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Изображение */}
        {news.imageUrl && (
          <div className="relative w-full max-h-96 overflow-hidden bg-gray-100">
            <Image
              src={news.imageUrl}
              alt={news.title}
              width={1200}
              height={600}
              className="w-full h-auto object-cover"
              unoptimized={news.imageUrl.includes('blob.vercel-storage.com')}
            />
          </div>
        )}

        {/* Содержание */}
        <div className="px-6 md:px-8 py-8">
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:mb-2">
            <div className="text-gray-700 whitespace-pre-line text-base leading-7">
              {news.content.split('\n').map((paragraph, index) => {
                if (paragraph.trim() === '') {
                  return <br key={index} className="mb-4" />;
                }
                return (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

