"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
      <div className={adminContainerClass}>
        <p className="text-slate-600">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Редактировать новость"
        description="Изменить новость"
        backHref="/admin/news"
      />

      <DashboardCard>
        <DashboardCardBody>
          <p className={cn(adminSectionLabelClass, "mb-2")}>Редактирование новости</p>
          <p className="mb-6 text-sm text-slate-600">Измените данные новости</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">
                Заголовок
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn("w-full px-3", adminFieldClass)}
                placeholder="Введите заголовок новости"
              />
            </div>
            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium text-slate-700">
                Содержание
              </label>
              <textarea
                id="content"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={cn("w-full min-h-[300px] px-3 py-2", adminFieldClass)}
                placeholder="Введите содержание новости"
              />
            </div>
            <div>
              <label htmlFor="image" className="mb-2 block text-sm font-medium text-slate-700">
                Изображение (опционально)
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className={cn("w-full px-3", adminFieldClass)}
              />
              {isUploading && (
                <p className="mt-2 text-sm text-slate-500">Загрузка изображения...</p>
              )}
              {imageUrl && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt="Предпросмотр"
                    className="max-w-md h-auto border border-slate-200"
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
                className="h-4 w-4 rounded-none"
              />
              <label htmlFor="published" className="text-sm font-medium text-slate-700">
                Опубликовать
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className={adminPrimaryBtnClass}>
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </Button>
              <Button asChild type="button" variant="outline" className={adminOutlineBtnClass}>
                <Link href="/admin/news">Отмена</Link>
              </Button>
            </div>
          </form>
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
}
