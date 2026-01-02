"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Edit, Upload, Search, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface DisclosureDocument {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DisclosureClientProps {
  initialDocuments: DisclosureDocument[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function DisclosureClient({ initialDocuments }: DisclosureClientProps) {
  const [documents, setDocuments] = useState<DisclosureDocument[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DisclosureDocument | null>(null);
  
  // Формы
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/disclosure");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация по поисковому запросу
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    
    const query = searchQuery.toLowerCase().trim();
    return documents.filter((doc) =>
      doc.title.toLowerCase().includes(query) ||
      doc.fileName.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  const openUploadDialog = () => {
    setTitle("");
    setOrder(0);
    setIsActive(true);
    setSelectedFile(null);
    setEditingDocument(null);
    setUploadDialogOpen(true);
  };

  const openEditDialog = (doc: DisclosureDocument) => {
    setEditingDocument(doc);
    setTitle(doc.title);
    setOrder(doc.order);
    setIsActive(doc.isActive);
    setSelectedFile(null);
    setEditDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      alert("Заполните название и выберите файл");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title.trim());

      const response = await fetch("/api/admin/disclosure/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await refreshData();
        setUploadDialogOpen(false);
        setTitle("");
        setSelectedFile(null);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при загрузке файла");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Ошибка при загрузке файла");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingDocument || !title.trim()) {
      alert("Заполните название");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/disclosure/${editingDocument.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          order,
          isActive,
        }),
      });

      if (response.ok) {
        await refreshData();
        setEditDialogOpen(false);
        setEditingDocument(null);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при обновлении");
      }
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Ошибка при обновлении");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот документ?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/disclosure/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await refreshData();
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при удалении");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Ошибка при удалении");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Раскрытие информации</h1>
          <p className="text-gray-600">Управление документами раскрытия информации</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={openUploadDialog} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить документ
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      {/* Поиск */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Поиск по названию или имени файла..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Список документов */}
      {loading && !documents.length ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Загрузка...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? "Документы не найдены" : "Документы отсутствуют"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {doc.title}
                      {doc.isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {doc.fileName} • {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(doc)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Открыть документ
                  </a>
                  <span className="text-sm text-gray-500">
                    Порядок: {doc.order}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог загрузки */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить документ</DialogTitle>
            <DialogDescription>
              Загрузите документ для раскрытия информации
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Название документа *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Отчет за 2024 год"
              />
            </div>
            <div>
              <Label htmlFor="file">Файл *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            <div>
              <Label htmlFor="order">Порядок отображения</Label>
              <Input
                id="order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive">Активен (отображать на сайте)</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !title.trim() || !selectedFile}>
                {uploading ? "Загрузка..." : "Загрузить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать документ</DialogTitle>
            <DialogDescription>
              Измените информацию о документе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Название документа *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Отчет за 2024 год"
              />
            </div>
            <div>
              <Label htmlFor="edit-order">Порядок отображения</Label>
              <Input
                id="edit-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="edit-isActive">Активен (отображать на сайте)</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleUpdate} disabled={loading || !title.trim()}>
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

