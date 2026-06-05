"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  adminFieldClass,
  adminOutlineBtnClass,
  adminPrimaryBtnClass,
  adminSectionLabelClass,
} from "@/components/admin/admin-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Edit, Upload, Search, CheckCircle2, XCircle } from "lucide-react";
import { publicFileHref } from "@/lib/public-file-url";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DisclosureDocument {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DisclosureDocument | null>(null);
  
  // Формы
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("uchreditelnye-dokumenty");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: "uchreditelnye-dokumenty", label: "Учредительные документы" },
    { value: "normativnye-dokumenty", label: "Нормативные документы" },
    { value: "informaciya-raskrytie", label: "Информация, подлежащая раскрытию" },
    { value: "zashchita-personalnyh-dannyh", label: "Защита персональных данных" },
    { value: "antikorrupciya", label: "Антикоррупционная политика" },
    { value: "investicionnaya-programma", label: "Инвестиционная программа" },
  ];

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

  // Фильтрация по поисковому запросу и категории
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Фильтр по категории
    if (selectedCategory !== "all") {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.fileName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [documents, searchQuery, selectedCategory]);

  const openUploadDialog = () => {
    setTitle("");
    setCategory("uchreditelnye-dokumenty");
    setOrder(0);
    setIsActive(true);
    setSelectedFile(null);
    setEditingDocument(null);
    setUploadDialogOpen(true);
  };

  const openEditDialog = (doc: DisclosureDocument) => {
    setEditingDocument(doc);
    setTitle(doc.title);
    setCategory(doc.category || "uchreditelnye-dokumenty");
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
      formData.append("category", category);

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
          category,
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
      <AdminPageHeader
        title="Раскрытие информации"
        description="Управление документами раскрытия информации"
        actions={
          <Button onClick={openUploadDialog} disabled={loading} className={adminPrimaryBtnClass}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить документ
          </Button>
        }
      />

      {/* Фильтры и поиск */}
      <div className="mb-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Фильтр по категории */}
          <div>
            <Label htmlFor="category-filter" className={cn("mb-2 block", adminSectionLabelClass)}>
              Категория
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-filter" className={cn("w-full", adminFieldClass)}>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Поиск */}
          <div>
            <Label htmlFor="search" className={cn("mb-2 block", adminSectionLabelClass)}>
              Поиск
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="search"
                type="text"
                placeholder="Поиск по названию или имени файла..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("pl-10", adminFieldClass)}
              />
            </div>
          </div>
        </div>

        {/* Информация о результатах */}
        {filteredDocuments.length !== documents.length && (
          <div className="text-sm text-slate-500">
            Показано {filteredDocuments.length} из {documents.length} документов
          </div>
        )}
      </div>

      {/* Список документов */}
      {loading && !documents.length ? (
        <div className="py-12 text-center">
          <p className="text-slate-500">Загрузка...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">
              {searchQuery ? "Документы не найдены" : "Документы отсутствуют"}
            </p>
          </DashboardCardBody>
        </DashboardCard>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <DashboardCard key={doc.id}>
              <DashboardCardBody className="p-0">
                <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                      {doc.title}
                      {doc.isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-400" />
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {doc.fileName} • {formatFileSize(doc.fileSize)}
                    </p>
                    {doc.category && (
                      <p className="mt-1 text-xs text-blue-600">
                        {categories.find(c => c.value === doc.category)?.label || doc.category}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={adminOutlineBtnClass}
                      onClick={() => openEditDialog(doc)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={adminOutlineBtnClass}
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4">
                  <a
                    href={publicFileHref(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Открыть документ
                  </a>
                  <span className="text-sm text-slate-500">
                    Порядок: {doc.order}
                  </span>
                </div>
                </div>
              </DashboardCardBody>
            </DashboardCard>
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
              <Label htmlFor="category">Категория *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="edit-category">Категория *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

