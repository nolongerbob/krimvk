import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, MessageSquare, Newspaper, Users, AlertCircle, CheckCircle, Clock, Folder, BookOpen } from "lucide-react";
import { AdminNotificationsBadge } from "@/components/admin/AdminNotificationsBadge";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  // Проверяем, что пользователь - администратор
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
  } catch (error) {
    console.error("Database connection error:", error);
    // Если ошибка подключения, пробуем переподключиться
    try {
      await prisma.$connect();
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
    } catch (retryError) {
      console.error("Failed to reconnect to database:", retryError);
      // Возвращаем ошибку подключения
      return (
        <div className="container py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-2">Ошибка подключения к базе данных</h1>
            <p className="text-red-600">Не удалось подключиться к базе данных. Пожалуйста, попробуйте позже.</p>
          </div>
        </div>
      );
    }
  }

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем статистику с обработкой ошибок
  const [
    pendingApplications,
    inProgressApplications,
    unansweredQuestionsCount,
    unpublishedNews,
    totalUsers,
  ] = await Promise.allSettled([
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.application.count({ where: { status: "IN_PROGRESS" } }),
    prisma.question.count({ 
      where: { 
        status: "PENDING",
        messages: {
          some: {
            isFromAdmin: false,
          },
          none: {
            isFromAdmin: true,
          },
        },
      },
    }),
    prisma.news.count({ where: { published: false } }),
    prisma.user.count({ where: { role: "USER" } }),
  ]).then((results) => {
    return results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error("Error loading statistics:", result.reason);
        return 0;
      }
    });
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Админ-панель</h1>
        <p className="text-gray-600">Управление системой</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Новые заявки</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications}</div>
            <p className="text-xs text-muted-foreground">Требуют обработки</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressApplications}</div>
            <p className="text-xs text-muted-foreground">Активные заявки</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Вопросы</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unansweredQuestionsCount}</div>
            <p className="text-xs text-muted-foreground">Без ответа</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Новости</CardTitle>
            <Newspaper className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpublishedNews}</div>
            <p className="text-xs text-muted-foreground">Не опубликовано</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Всего</p>
          </CardContent>
        </Card>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-10 w-10 text-blue-500 mb-2" />
            <CardTitle className="flex items-center">
              Управление заявками
              <AdminNotificationsBadge type="applications" />
            </CardTitle>
            <CardDescription>Просмотр и обработка заявок</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/applications">Перейти</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <MessageSquare className="h-10 w-10 text-purple-500 mb-2" />
            <CardTitle className="flex items-center">
              Вопросы и ответы
              <AdminNotificationsBadge type="questions" />
            </CardTitle>
            <CardDescription>Ответы на вопросы пользователей</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/questions">Перейти</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Newspaper className="h-10 w-10 text-green-500 mb-2" />
            <CardTitle>Управление новостями</CardTitle>
            <CardDescription>Создание и публикация новостей</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/news">Перейти</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Users className="h-10 w-10 text-gray-500 mb-2" />
            <CardTitle>Пользователи</CardTitle>
            <CardDescription>Управление пользователями</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/users">Перейти</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Folder className="h-10 w-10 text-orange-500 mb-2" />
            <CardTitle>Управление разделами</CardTitle>
            <CardDescription>Создание и редактирование страниц сайта</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/pages">Перейти</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BookOpen className="h-10 w-10 text-indigo-500 mb-2" />
            <CardTitle>Управление постами</CardTitle>
            <CardDescription>Создание постов в разделах</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/posts">Перейти</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

