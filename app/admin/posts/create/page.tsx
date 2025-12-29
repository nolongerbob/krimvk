"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Category {
  id: string;
  title: string;
  slug: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    pageId: "",
    title: "",
    content: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Загружаем список категорий (разделов для постов)
    fetch("/api/admin/pages")
      .then((res) => res.json())
      .then((data) => {
        if (data.pages) {
          // Фильтруем только категории
          const cats = data.pages.filter((p: any) => p.isCategory && p.isActive);
          setCategories(cats);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Создаем пост
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Ошибка при создании поста");
        setIsLoading(false);
        return;
      }

      const { post } = await response.json();

      // Загружаем файлы, если есть
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const uploadResponse = await fetch(`/api/admin/posts/${post.id}/upload`, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            console.error("Ошибка при загрузке файла:", file.name);
          }
        }
      }

      router.push("/admin/posts");
      router.refresh();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Ошибка при создании поста");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/posts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Создать пост</h1>
        <p className="text-gray-600">Создание нового поста в разделе</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация о посте</CardTitle>
          <CardDescription>Заполните все необходимые поля</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Раздел <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.pageId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pageId: e.target.value }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите раздел</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Заголовок <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Заголовок поста"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Содержимое <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={15}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="HTML или текст содержимого поста"
              />
              <p className="text-xs text-gray-500 mt-1">
                Можно использовать HTML разметку
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Прикрепленные файлы (опционально)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Максимальный размер файла: 50MB. Можно выбрать несколько файлов.
              </p>
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading || isUploading ? "Создание..." : "Создать пост"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/posts">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

