import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, Plus, Eye, EyeOff, Calendar, User } from "lucide-react";
import Link from "next/link";
import { NewsActions } from "@/components/admin/NewsActions";

export default async function AdminNewsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/news");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем все новости
  const news = await prisma.news.findMany({
    include: {
      author: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление новостями</h1>
          <p className="text-gray-600">Создание и публикация новостей</p>
        </div>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/admin/news/create">
              <Plus className="h-4 w-4 mr-2" />
              Создать новость
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <Card key={item.id} className={item.published ? "border-green-200" : "border-yellow-200"}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{item.title}</CardTitle>
                    {item.published ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <CardDescription className="mb-4 line-clamp-3">{item.content}</CardDescription>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{item.author.name || item.author.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Создана: {new Date(item.createdAt).toLocaleDateString("ru-RU")}</span>
                    </div>
                    {item.publishedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Опубликована: {new Date(item.publishedAt).toLocaleDateString("ru-RU")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <NewsActions newsId={item.id} published={item.published} />
            </CardContent>
          </Card>
        ))}
      </div>

      {news.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Нет новостей</p>
            <Button asChild>
              <Link href="/admin/news/create">
                <Plus className="h-4 w-4 mr-2" />
                Создать первую новость
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

