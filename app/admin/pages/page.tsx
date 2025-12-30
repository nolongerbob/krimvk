import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PagesClient } from "./PagesClient";

export default async function AdminPagesPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/pages");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем все страницы
  const pages = await prisma.page.findMany({
    include: {
      author: { select: { name: true, email: true } },
      parent: { select: { id: true, title: true, slug: true } },
      _count: { select: { children: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление разделами</h1>
          <p className="text-gray-600">Создание и редактирование страниц сайта</p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/admin/pages/create">Создать страницу</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      <PagesClient pages={pages as any} />
    </div>
  );
}





