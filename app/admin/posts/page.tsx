import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PostsClient } from "./PostsClient";

export default async function AdminPostsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/admin/posts");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем все посты
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      createdAt: true,
      page: { select: { id: true, title: true, slug: true } },
      author: { select: { name: true, email: true } },
      _count: { select: { attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Загружаем все категории (разделы для постов)
  const categories = await prisma.page.findMany({
    where: { isCategory: true, isActive: true },
    select: { id: true, title: true, slug: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление постами</h1>
          <p className="text-gray-600">Создание и редактирование постов в разделах</p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/admin/posts/create">Создать пост</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      <PostsClient posts={posts} categories={categories} />
    </div>
  );
}

