import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { ApplicationsClient } from "./ApplicationsClient";

export default async function AdminApplicationsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/applications");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем все заявки
  const applications = await prisma.application.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      service: { select: { id: true, title: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Получаем уникальные категории услуг
  const categories = await prisma.service.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление заявками</h1>
          <p className="text-gray-600">Обработка заявок пользователей</p>
        </div>
        <div className="flex items-center gap-4">
          <AutoRefresh interval={15} />
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      <ApplicationsClient applications={applications} categories={categories.map(c => c.category)} />
    </div>
  );
}

