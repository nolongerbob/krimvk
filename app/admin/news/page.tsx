import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Newspaper, Plus, Eye, EyeOff, Calendar, User } from "lucide-react";
import Link from "next/link";
import { NewsActions } from "@/components/admin/NewsActions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { adminContainerClass, adminPrimaryBtnClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

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

  const news = await prisma.news.findMany({
    include: {
      author: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Управление новостями"
        description="Создание и публикация новостей"
        actions={
          <Button asChild className={adminPrimaryBtnClass}>
            <Link href="/admin/news/create">
              <Plus className="mr-2 h-4 w-4" />
              Создать новость
            </Link>
          </Button>
        }
      />

      <div className="space-y-4">
        {news.map((item) => (
          <DashboardCard key={item.id}>
            <DashboardCardBody className="p-0">
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium",
                          item.published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                        )}
                      >
                        {item.published ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Опубликовано
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Черновик
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mb-4 line-clamp-3 text-sm text-slate-600">{item.content}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
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
                          <span>
                            Опубликована: {new Date(item.publishedAt).toLocaleDateString("ru-RU")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <NewsActions newsId={item.id} published={item.published} />
              </div>
            </DashboardCardBody>
          </DashboardCard>
        ))}
      </div>

      {news.length === 0 && (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <Newspaper className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="mb-4 text-slate-500">Нет новостей</p>
            <Button asChild className={adminPrimaryBtnClass}>
              <Link href="/admin/news/create">
                <Plus className="mr-2 h-4 w-4" />
                Создать первую новость
              </Link>
            </Button>
          </DashboardCardBody>
        </DashboardCard>
      )}
    </div>
  );
}
