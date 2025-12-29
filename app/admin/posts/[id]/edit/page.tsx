"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Upload, File, Download, Trash2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  pageId: string;
}

interface Category {
  id: string;
  title: string;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    pageId: "",
    title: "",
    content: "",
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/admin/posts/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
          setFormData({
            pageId: data.post.pageId,
            title: data.post.title,
            content: data.post.content,
          });
        } else {
          alert("Пост не найден");
          router.push("/admin/posts");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        alert("Ошибка при загрузке поста");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFiles = async () => {
      try {
        const response = await fetch(`/api/admin/posts/${params.id}/files`);
        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/admin/pages");
        if (response.ok) {
          const data = await response.json();
          const cats = data.pages.filter((p: any) => p.isCategory && p.isActive);
          setCategories(cats);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchPost();
    fetchFiles();
    fetchCategories();
  }, [params.id, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/posts/${params.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFiles([...files, data.file]);
        e.target.value = "";
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
      const response = await fetch(`/api/admin/posts/${params.id}/files`, {
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
      const response = await fetch(`/api/admin/posts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/admin/posts");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при обновлении поста");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Ошибка при обновлении поста");
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

  if (!post) {
    return null;
  }

  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/posts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Редактировать пост</h1>
        <p className="text-gray-600">Редактирование поста: {post.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация о посте</CardTitle>
          <CardDescription>Измените необходимые поля</CardDescription>
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
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Сохранение..." : "Сохранить изменения"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/posts">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Управление файлами */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Прикрепленные файлы</CardTitle>
          <CardDescription>Загрузите файлы для этого поста</CardDescription>
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

