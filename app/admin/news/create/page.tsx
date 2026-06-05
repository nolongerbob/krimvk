"use client";

import { useState } from "react";
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

export default function CreateNewsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

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
      const response = await fetch("/api/admin/news/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageUrl, published }),
      });

      if (response.ok) {
        router.push("/admin/news");
      } else {
        alert("Ошибка при создании новости");
      }
    } catch (error) {
      alert("Ошибка при создании новости");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Создать новость"
        description="Добавить новую новость"
        backHref="/admin/news"
      />

      <DashboardCard>
        <DashboardCardBody>
          <p className={cn(adminSectionLabelClass, "mb-2")}>Новая новость</p>
          <p className="mb-6 text-sm text-slate-600">Заполните форму для создания новости</p>
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
            <div className="flex items-center gap-3 border border-blue-200 bg-blue-50 p-4">
              <input
                id="published"
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-5 w-5 rounded-none border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="published" className="cursor-pointer text-sm font-semibold text-blue-900">
                Опубликовать сразу (новость будет видна на сайте)
              </label>
            </div>
            {!published && (
              <div className="border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  Новость будет создана как черновик и не будет отображаться на сайте.
                  Вы сможете опубликовать её позже из списка новостей.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className={adminPrimaryBtnClass}>
                {isLoading ? "Создание..." : "Создать новость"}
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
