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
    <div className="container py-8 px-4">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/news">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к новостям
          </Link>
        </Button>
      </div>

      <Card>
        {news.imageUrl && (
          <div className="relative w-full aspect-video overflow-hidden rounded-t-lg bg-gray-100">
            <Image
              src={news.imageUrl}
              alt={news.title}
              fill
              className="object-contain rounded-t-lg"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-3xl mb-4">{news.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
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
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="text-gray-700 whitespace-pre-line">
              {news.content}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

