"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Upload, X, File, Download, Trash2 } from "lucide-react";

interface Page {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  parentId: string | null;
  order: number;
  isActive: boolean;
}

interface PageOption {
  id: string;
  title: string;
  slug: string;
}

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState<Page | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [pages, setPages] = useState<PageOption[]>([]);
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
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/admin/pages/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setPage(data.page);
          setFormData({
            title: data.page.title,
            slug: data.page.slug,
            description: data.page.description || "",
            content: data.page.content || "",
            parentId: data.page.parentId || "",
            order: data.page.order,
            isActive: data.page.isActive,
            isCategory: data.page.isCategory || false,
          });
        } else {
          alert("Страница не найдена");
          router.push("/admin/pages");
        }
      } catch (error) {
        console.error("Error fetching page:", error);
        alert("Ошибка при загрузке страницы");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFiles = async () => {
      try {
        const response = await fetch(`/api/admin/pages/${params.id}/files`);
        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    const fetchPages = async () => {
      try {
        const response = await fetch("/api/admin/pages");
        if (response.ok) {
          const data = await response.json();
          // Исключаем текущую страницу из списка возможных родителей
          setPages(data.pages.filter((p: PageOption) => p.id !== params.id) || []);
        }
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    };

    fetchPage();
    fetchFiles();
    fetchPages();
  }, [params.id, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/pages/${params.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFiles([...files, data.file]);
        e.target.value = ""; // Очищаем input
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при загрузке файла");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот файл?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pages/${params.id}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        setFiles(files.filter((f) => f.id !== fileId));
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при удалении файла");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Ошибка при удалении файла");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/pages/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
          order: Number(formData.order) || 0,
          content: formData.content || null,
        }),
      });

      if (response.ok) {
        router.push("/admin/pages");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при обновлении страницы");
      }
    } catch (error) {
      console.error("Error updating page:", error);
      alert("Ошибка при обновлении страницы");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/pages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Редактировать страницу</h1>
        <p className="text-gray-600">Редактирование страницы: {page.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация о странице</CardTitle>
          <CardDescription>Измените необходимые поля</CardDescription>
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              />
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Содержимое {!formData.isCategory && <span className="text-red-500">*</span>}
              </label>
              <textarea
                required={!formData.isCategory}
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={15}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                disabled={formData.isCategory}
                placeholder={formData.isCategory ? "Для категорий постов содержимое не требуется" : ""}
              />
              {formData.isCategory && (
                <p className="text-xs text-gray-500 mt-1">
                  Для категорий постов содержимое не требуется
                </p>
              )}
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
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.slug})
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
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Сохранение..." : "Сохранить изменения"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/pages">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Управление файлами */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Прикрепленные файлы</CardTitle>
          <CardDescription>Загрузите файлы для этой страницы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Загрузить файл
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isUploading && (
                <span className="text-sm text-gray-500">Загрузка...</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Максимальный размер файла: 50MB
            </p>
          </div>

          {files.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {file.mimeType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title="Скачать"
                    >
                      <a href={file.filePath} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileDelete(file.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Нет прикрепленных файлов
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

