"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, EyeOff, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  // Группируем страницы по родителям
  const rootPages = pages.filter((p) => !p.parentId);
  const childPages = pages.filter((p) => p.parentId);

  const getChildren = (parentId: string) => {
    return childPages.filter((p) => p.parentId === parentId);
  };

  return (
    <div className="space-y-6">
      {rootPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">Нет созданных страниц</p>
            <Button asChild>
              <Link href="/admin/pages/create">Создать первую страницу</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        rootPages.map((page) => {
          const children = getChildren(page.id);
          return (
            <div key={page.id} className="space-y-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle>{page.title}</CardTitle>
                        {!page.isActive && (
                          <Badge variant="secondary">Неактивна</Badge>
                        )}
                        {page.isCategory && (
                          <Badge variant="default" className="bg-indigo-500">
                            Категория
                          </Badge>
                        )}
                        {page._count.children > 0 && (
                          <Badge variant="outline">
                            {page._count.children} подстраниц
                          </Badge>
                        )}
                        {page.isCategory && page._count.posts > 0 && (
                          <Badge variant="outline">
                            {page._count.posts} постов
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        <div className="space-y-1">
                          <p className="text-sm">URL: <code className="bg-gray-100 px-1 rounded">{page.slug}</code></p>
                          {page.description && (
                            <p className="text-sm text-gray-600">{page.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Автор: {page.author.name || page.author.email} • 
                            Обновлено: {new Date(page.updatedAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(page.id, page.isActive)}
                        title={page.isActive ? "Скрыть" : "Показать"}
                      >
                        {page.isActive ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/pages/${page.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(page.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              {children.length > 0 && (
                <div className="ml-8 space-y-2">
                  {children.map((child) => (
                    <Card key={child.id} className="bg-gray-50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-base">{child.title}</CardTitle>
                              {!child.isActive && (
                                <Badge variant="secondary">Неактивна</Badge>
                              )}
                            </div>
                            <CardDescription>
                              <div className="space-y-1">
                                <p className="text-sm">URL: <code className="bg-gray-100 px-1 rounded">{child.slug}</code></p>
                                {child.description && (
                                  <p className="text-sm text-gray-600">{child.description}</p>
                                )}
                              </div>
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(child.id, child.isActive)}
                            >
                              {child.isActive ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/admin/pages/${child.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(child.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
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

