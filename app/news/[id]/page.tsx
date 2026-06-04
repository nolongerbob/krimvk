import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { formatPublicAuthorName } from "@/lib/format-public-author";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await prisma.news.findUnique({
    where: {
      id,
      published: true,
    },
    include: {
      author: { select: { name: true, email: true } },
    },
  });

  if (!news) {
    notFound();
  }

  return (
    <div className="bg-gray-50 py-12 md:py-14">
      <div className="container mx-auto max-w-4xl px-4">
        <Button asChild variant="ghost" className="mb-6 rounded-none hover:scale-100 active:scale-100">
          <Link href="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к новостям
          </Link>
        </Button>

        <article className="overflow-hidden rounded-none border border-gray-200 bg-white shadow-none">
          <div className="border-b border-gray-200 px-6 pb-6 pt-8 md:px-8">
            <h1 className="mb-4 text-3xl font-semibold leading-tight tracking-tight text-gray-900 md:text-4xl">
              {news.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{formatPublicAuthorName(news.author.name, news.author.email)}</span>
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

          {news.imageUrl && (
            <div className="px-6 py-6 md:px-8">
              <div className="relative flex h-96 w-full items-center justify-center overflow-hidden bg-gray-100">
                <Image
                  src={news.imageUrl}
                  alt={news.title}
                  fill
                  className="object-contain"
                  unoptimized={news.imageUrl.includes("blob.vercel-storage.com")}
                />
              </div>
            </div>
          )}

          <div className="px-6 py-8 md:px-8">
            <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:mb-4 prose-p:leading-relaxed prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:mb-2">
              <div className="whitespace-pre-line text-base leading-7 text-gray-700">
                {news.content.split("\n").map((paragraph: string, index: number) => {
                  if (paragraph.trim() === "") {
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
    </div>
  );
}
