"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditNewsPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // Загружаем данные новости
    fetch(`/api/admin/news/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.news) {
          setTitle(data.news.title);
          setContent(data.news.content);
          setImageUrl(data.news.imageUrl || "");
          setPublished(data.news.published);
        }
        setIsLoadingData(false);
      })
      .catch(() => {
        setIsLoadingData(false);
      });
  }, [params.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/news/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImageUrl(data.imageUrl);
      } else {
        const errorMsg = data.details || data.error || "Ошибка при загрузке изображения";
        alert(errorMsg);
        console.error("Upload error:", data);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Ошибка при загрузке изображения. Проверьте консоль для деталей.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/news/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageUrl, published }),
      });

      if (response.ok) {
        router.push("/admin/news");
      } else {
        alert("Ошибка при обновлении новости");
      }
    } catch (error) {
      alert("Ошибка при обновлении новости");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="container py-8 px-4">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/news">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Редактировать новость</h1>
          <p className="text-gray-600">Изменить новость</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Редактирование новости</CardTitle>
          <CardDescription>Измените данные новости</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Заголовок
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Введите заголовок новости"
              />
            </div>
            <div>
              <label htmlFor="content" className="text-sm font-medium mb-2 block">
                Содержание
              </label>
              <textarea
                id="content"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[300px]"
                placeholder="Введите содержание новости"
              />
            </div>
            <div>
              <label htmlFor="image" className="text-sm font-medium mb-2 block">
                Изображение (опционально)
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {isUploading && (
                <p className="text-sm text-gray-500 mt-2">Загрузка изображения...</p>
              )}
              {imageUrl && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt="Предпросмотр"
                    className="max-w-md h-auto rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Удалить изображение
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="published" className="text-sm font-medium">
                Опубликовать
              </label>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/news">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

