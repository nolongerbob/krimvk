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
    fetch("/api/admin/pages")
      .then((res) => res.json())
      .then((data) => {
        if (data.pages) {
          const cats = data.pages.filter((p: { isCategory: boolean; isActive: boolean }) => p.isCategory && p.isActive);
          setCategories(cats);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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

      if (selectedFiles.length > 0) {
        setIsUploading(true);
        for (const file of selectedFiles) {
          const uploadData = new FormData();
          uploadData.append("file", file);
          await fetch(`/api/admin/posts/${post.id}/upload`, {
            method: "POST",
            body: uploadData,
          });
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
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Создать пост"
        description="Создание нового поста в разделе"
        backHref="/admin/posts"
      />

      <DashboardCard>
        <DashboardCardBody>
          <p className={cn(adminSectionLabelClass, "mb-2")}>Информация о посте</p>
          <p className="mb-6 text-sm text-slate-600">Заполните все необходимые поля</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Раздел <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.pageId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pageId: e.target.value }))
                }
                className={cn("w-full px-4", adminFieldClass)}
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
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Заголовок <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className={cn("w-full px-4", adminFieldClass)}
                placeholder="Заголовок поста"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Содержимое <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={15}
                className={cn("w-full px-4 py-2 font-mono text-sm", adminFieldClass)}
                placeholder="HTML или текст содержимого поста"
              />
              <p className="mt-1 text-xs text-slate-500">Можно использовать HTML разметку</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Прикрепленные файлы (опционально)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className={cn("w-full px-4", adminFieldClass)}
              />
              <p className="mt-1 text-xs text-slate-500">
                Максимальный размер файла: 50MB. Можно выбрать несколько файлов.
              </p>
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-50 p-2"
                    >
                      <span className="text-sm text-slate-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button type="submit" disabled={isLoading || isUploading} className={adminPrimaryBtnClass}>
                {isLoading || isUploading ? "Создание..." : "Создать пост"}
              </Button>
              <Button type="button" variant="outline" asChild className={adminOutlineBtnClass}>
                <Link href="/admin/posts">Отмена</Link>
              </Button>
            </div>
          </form>
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
}
