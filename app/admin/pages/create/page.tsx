"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import {
  adminContainerClass,
  adminFieldClass,
  adminOutlineBtnClass,
  adminPrimaryBtnClass,
  adminSectionLabelClass,
} from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

interface Page {
  id: string;
  title: string;
  slug: string;
}

export default function CreatePagePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    parentId: "",
    order: 0,
    isActive: true,
    isCategory: false,
  });

  useEffect(() => {
    // Загружаем список страниц для выбора родителя
    fetch("/api/admin/pages")
      .then((res) => res.json())
      .then((data) => {
        if (data.pages) {
          setPages(data.pages);
        }
      })
      .catch((err) => console.error("Error fetching pages:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
          order: Number(formData.order) || 0,
          content: formData.content || null,
          isCategory: formData.isCategory || false,
        }),
      });

      if (response.ok) {
        router.push("/admin/pages");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при создании страницы");
      }
    } catch (error) {
      console.error("Error creating page:", error);
      alert("Ошибка при создании страницы");
    } finally {
      setIsLoading(false);
    }
  };

  // Генерируем slug из title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Создать страницу"
        description="Создание новой страницы сайта"
        backHref="/admin/pages"
        backLabel="Назад к списку"
      />

      <DashboardCard>
        <DashboardCardBody>
          <p className={cn(adminSectionLabelClass, "mb-2")}>Информация о странице</p>
          <p className="mb-6 text-sm text-slate-600">Заполните все необходимые поля</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Заголовок <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                className={cn("w-full px-4", adminFieldClass)}
                placeholder="Например: О компании"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                className={cn("w-full px-4 py-2 font-mono text-sm", adminFieldClass)}
                placeholder="/o-kompanii/rukovodstvo"
              />
              <p className="text-xs text-slate-500 mt-1">
                URL должен начинаться с / и содержать только латинские буквы, цифры и дефисы
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Описание (для SEO)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className={cn("w-full px-4", adminFieldClass)}
                placeholder="Краткое описание страницы для поисковых систем"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Содержимое (опционально)
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={15}
                className={cn("w-full px-4 py-2 font-mono text-sm", adminFieldClass)}
                placeholder="HTML или текст содержимого страницы (оставьте пустым для категории постов)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Можно использовать HTML разметку. Оставьте пустым, если это категория для постов.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isCategory}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isCategory: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Категория для постов</span>
              </label>
              <p className="text-xs text-slate-500 mt-1">
                Если отмечено, в этом разделе можно будет создавать посты
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Родительская страница (опционально)
              </label>
              <select
                value={formData.parentId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, parentId: e.target.value }))
                }
                className={cn("w-full px-4", adminFieldClass)}
              >
                <option value="">Нет (корневая страница)</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title} ({page.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Порядок отображения
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: Number(e.target.value) || 0,
                    }))
                  }
                  className={cn("w-full px-4", adminFieldClass)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Статус
                </label>
                <select
                  value={formData.isActive ? "true" : "false"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.value === "true",
                    }))
                  }
                  className={cn("w-full px-4", adminFieldClass)}
                >
                  <option value="true">Активна</option>
                  <option value="false">Неактивна</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className={adminPrimaryBtnClass}>
                {isLoading ? "Создание..." : "Создать страницу"}
              </Button>
              <Button type="button" variant="outline" asChild className={adminOutlineBtnClass}>
                <Link href="/admin/pages">Отмена</Link>
              </Button>
            </div>
          </form>
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
}

