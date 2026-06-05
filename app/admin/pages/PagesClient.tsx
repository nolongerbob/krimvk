"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, EyeOff, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { adminPrimaryBtnClass } from "@/components/admin/admin-styles";
interface Page {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  isCategory: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    name: string | null;
    email: string;
  };
  parent: {
    id: string;
    title: string;
    slug: string;
  } | null;
  _count: {
    children: number;
    posts: number;
  };
}

interface PagesClientProps {
  pages: Page[];
}

export function PagesClient({ pages: initialPages }: PagesClientProps) {
  const [pages, setPages] = useState(initialPages);
  const router = useRouter();

  const handleDelete = async (pageId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту страницу?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPages(pages.filter((p) => p.id !== pageId));
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при удалении страницы");
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      alert("Ошибка при удалении страницы");
    }
  };

  const handleToggleActive = async (pageId: string, currentStatus: boolean) => {
    try {
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;

      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...page,
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        setPages(
          pages.map((p) =>
            p.id === pageId ? { ...p, isActive: !currentStatus } : p
          )
        );
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при обновлении статуса");
      }
    } catch (error) {
      console.error("Error toggling page status:", error);
      alert("Ошибка при обновлении статуса");
    }
  };

  const rootPages = pages.filter((p) => !p.parentId);
  const childPages = pages.filter((p) => p.parentId);

  const getChildren = (parentId: string) => {
    return childPages.filter((p) => p.parentId === parentId);
  };

  const renderPageActions = (page: Page) => (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleToggleActive(page.id, page.isActive)}
        title={page.isActive ? "Скрыть" : "Показать"}
        className="rounded-none"
      >
        {page.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" asChild className="rounded-none">
        <Link href={`/admin/pages/${page.id}/edit`}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(page.id)}
        className="rounded-none text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {rootPages.length === 0 ? (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="mb-4 text-slate-500">Нет созданных страниц</p>
            <Button asChild className={adminPrimaryBtnClass}>
              <Link href="/admin/pages/create">Создать первую страницу</Link>
            </Button>
          </DashboardCardBody>
        </DashboardCard>
      ) : (
        rootPages.map((page) => {
          const children = getChildren(page.id);
          return (
            <div key={page.id} className="space-y-2">
              <DashboardCard>
                <DashboardCardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{page.title}</h2>
                        {!page.isActive && (
                          <Badge variant="secondary" className="rounded-none">
                            Неактивна
                          </Badge>
                        )}
                        {page.isCategory && (
                          <Badge className="rounded-none bg-blue-600">Категория</Badge>
                        )}
                        {page._count.children > 0 && (
                          <Badge variant="outline" className="rounded-none">
                            {page._count.children} подстраниц
                          </Badge>
                        )}
                        {page.isCategory && page._count.posts > 0 && (
                          <Badge variant="outline" className="rounded-none">
                            {page._count.posts} постов
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p>
                          URL:{" "}
                          <code className="bg-slate-100 px-1 font-mono text-xs">{page.slug}</code>
                        </p>
                        {page.description && <p>{page.description}</p>}
                        <p className="text-xs text-slate-500">
                          Автор: {page.author.name || page.author.email} • Обновлено:{" "}
                          {new Date(page.updatedAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                    {renderPageActions(page)}
                  </div>
                </DashboardCardBody>
              </DashboardCard>
              {children.length > 0 && (
                <div className="ml-8 space-y-2">
                  {children.map((child) => (
                    <DashboardCard key={child.id} className="bg-slate-50/80">
                      <DashboardCardBody>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900">{child.title}</h3>
                              {!child.isActive && (
                                <Badge variant="secondary" className="rounded-none">
                                  Неактивна
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-slate-600">
                              <p>
                                URL:{" "}
                                <code className="bg-slate-100 px-1 font-mono text-xs">{child.slug}</code>
                              </p>
                              {child.description && <p>{child.description}</p>}
                            </div>
                          </div>
                          {renderPageActions(child)}
                        </div>
                      </DashboardCardBody>
                    </DashboardCard>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
