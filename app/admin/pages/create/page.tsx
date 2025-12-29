"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <div className="container py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/pages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Создать страницу</h1>
        <p className="text-gray-600">Создание новой страницы сайта</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация о странице</CardTitle>
          <CardDescription>Заполните все необходимые поля</CardDescription>
        </CardHeader>
        <CardContent>
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="/o-kompanii/rukovodstvo"
              />
              <p className="text-xs text-gray-500 mt-1">
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="HTML или текст содержимого страницы (оставьте пустым для категории постов)"
              />
              <p className="text-xs text-gray-500 mt-1">
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
              <p className="text-xs text-gray-500 mt-1">
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Активна</option>
                  <option value="false">Неактивна</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Создание..." : "Создать страницу"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/pages">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

