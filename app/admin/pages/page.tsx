import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PagesClient } from "./PagesClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { adminContainerClass, adminPrimaryBtnClass } from "@/components/admin/admin-styles";

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

  const pages = await prisma.page.findMany({
    include: {
      author: { select: { name: true, email: true } },
      parent: { select: { id: true, title: true, slug: true } },
      _count: { select: { children: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Управление разделами"
        description="Создание и редактирование страниц сайта"
        actions={
          <Button asChild className={adminPrimaryBtnClass}>
            <Link href="/admin/pages/create">
              <Plus className="mr-2 h-4 w-4" />
              Создать страницу
            </Link>
          </Button>
        }
      />

      <PagesClient pages={pages as any} />
    </div>
  );
}
