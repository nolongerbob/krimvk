"use client";

import { useState, useEffect } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Droplet, Plus, Trash2, Edit, FileText, Calendar, MapPin, Upload, X } from "lucide-react";
import Link from "next/link";

interface WaterQualityDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface WaterQualityYear {
  id: string;
  year: number;
  order: number;
  isActive: boolean;
  documents: WaterQualityDocument[];
}

interface WaterQualityRegion {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  years: WaterQualityYear[];
}

interface WaterQualityClientProps {
  initialRegions: WaterQualityRegion[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function WaterQualityClient({ initialRegions }: WaterQualityClientProps) {
  const [regions, setRegions] = useState<WaterQualityRegion[]>(initialRegions);
  const [loading, setLoading] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Диалоги
  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<WaterQualityRegion | null>(null);
  const [editingYear, setEditingYear] = useState<{ yearId: string; regionId: string } | null>(null);

  // Формы
  const [regionName, setRegionName] = useState("");
  const [regionOrder, setRegionOrder] = useState(0);
  const [yearValue, setYearValue] = useState("");
  const [yearOrder, setYearOrder] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/water-quality/regions");
      if (response.ok) {
        const data = await response.json();
        setRegions(data);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegion = async () => {
    if (!regionName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/water-quality/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regionName,
          order: regionOrder,
        }),
      });

      if (response.ok) {
        await refreshData();
        setRegionDialogOpen(false);
        setRegionName("");
        setRegionOrder(0);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при создании региона");
      }
    } catch (error) {
      console.error("Error creating region:", error);
      alert("Ошибка при создании региона");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRegion = async (regionId: string) => {
    if (!regionName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/water-quality/regions/${regionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regionName,
          order: regionOrder,
        }),
      });

      if (response.ok) {
        await refreshData();
        setRegionDialogOpen(false);
        setEditingRegion(null);
        setRegionName("");
        setRegionOrder(0);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при обновлении региона");
      }
    } catch (error) {
      console.error("Error updating region:", error);
      alert("Ошибка при обновлении региона");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegion = async (regionId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот регион? Все связанные годы и документы также будут удалены.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/water-quality/regions/${regionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await refreshData();
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при удалении региона");
      }
    } catch (error) {
      console.error("Error deleting region:", error);
      alert("Ошибка при удалении региона");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async () => {
    if (!yearValue || !editingYear) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/water-quality/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionId: editingYear.regionId,
          year: parseInt(yearValue),
          order: yearOrder,
        }),
      });

      if (response.ok) {
        await refreshData();
        setYearDialogOpen(false);
        setEditingYear(null);
        setYearValue("");
        setYearOrder(0);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при создании года");
      }
    } catch (error) {
      console.error("Error creating year:", error);
      alert("Ошибка при создании года");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = async (yearId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот год? Все связанные документы также будут удалены.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/water-quality/years/${yearId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await refreshData();
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при удалении года");
      }
    } catch (error) {
      console.error("Error deleting year:", error);
      alert("Ошибка при удалении года");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !selectedYearId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("yearId", selectedYearId);

      const response = await fetch("/api/admin/water-quality/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("File uploaded successfully:", data);
        await refreshData();
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setSelectedYearId(null);
        // Сброс input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const error = await response.json();
        console.error("Upload error response:", error);
        alert(error.error || "Ошибка при загрузке файла");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Ошибка при загрузке файла");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот документ?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/water-quality/documents/${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await refreshData();
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при удалении документа");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Ошибка при удалении документа");
    } finally {
      setLoading(false);
    }
  };

  const openRegionDialog = (region?: WaterQualityRegion) => {
    if (region) {
      setEditingRegion(region);
      setRegionName(region.name);
      setRegionOrder(region.order);
    } else {
      setEditingRegion(null);
      setRegionName("");
      setRegionOrder(0);
    }
    setRegionDialogOpen(true);
  };

  const openYearDialog = (regionId: string) => {
    setEditingYear({ yearId: "", regionId });
    setYearValue("");
    setYearOrder(0);
    setYearDialogOpen(true);
  };

  const openUploadDialog = (yearId: string) => {
    setSelectedYearId(yearId);
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление качеством питьевой воды</h1>
          <p className="text-gray-600">Создание разделов (городов), годов и загрузка документов</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => openRegionDialog()} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Создать регион
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      {regions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Нет регионов</p>
            <Button onClick={() => openRegionDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Создать первый регион
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {regions.map((region) => (
            <Card key={region.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-2xl">{region.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRegionDialog(region)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openYearDialog(region.id)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить год
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRegion(region.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {region.years.length === 0 ? (
                  <p className="text-gray-500">Годы для этого региона пока не добавлены</p>
                ) : (
                  <div className="space-y-4">
                    {region.years.map((year) => (
                      <div key={year.id} className="border-l-4 border-l-blue-500 pl-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <h3 className="text-xl font-semibold">{year.year} год</h3>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUploadDialog(year.id)}
                              disabled={loading}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Загрузить документ
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteYear(year.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {year.documents.length === 0 ? (
                          <p className="text-gray-500 text-sm">Документы для этого года пока не загружены</p>
                        ) : (
                          <div className="grid gap-2 mt-3">
                            {year.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                                  >
                                    {doc.fileName}
                                  </a>
                                  <p className="text-sm text-gray-500">
                                    {formatFileSize(doc.fileSize)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  disabled={loading}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог создания/редактирования региона */}
      <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRegion ? "Редактировать регион" : "Создать регион"}
            </DialogTitle>
            <DialogDescription>
              {editingRegion
                ? "Измените данные региона"
                : "Добавьте новый регион (город) для качества воды"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="region-name">Название региона</Label>
              <Input
                id="region-name"
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
                placeholder="Например: Симферополь"
              />
            </div>
            <div>
              <Label htmlFor="region-order">Порядок отображения</Label>
              <Input
                id="region-order"
                type="number"
                value={regionOrder}
                onChange={(e) => setRegionOrder(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRegionDialogOpen(false);
                  setEditingRegion(null);
                  setRegionName("");
                  setRegionOrder(0);
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={() => {
                  if (editingRegion) {
                    handleUpdateRegion(editingRegion.id);
                  } else {
                    handleCreateRegion();
                  }
                }}
                disabled={loading || !regionName.trim()}
              >
                {editingRegion ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог создания года */}
      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить год</DialogTitle>
            <DialogDescription>
              Добавьте новый год для выбранного региона
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="year-value">Год</Label>
              <Input
                id="year-value"
                type="number"
                value={yearValue}
                onChange={(e) => setYearValue(e.target.value)}
                placeholder="Например: 2024"
                min="2000"
                max="2100"
              />
            </div>
            <div>
              <Label htmlFor="year-order">Порядок отображения</Label>
              <Input
                id="year-order"
                type="number"
                value={yearOrder}
                onChange={(e) => setYearOrder(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setYearDialogOpen(false);
                  setEditingYear(null);
                  setYearValue("");
                  setYearOrder(0);
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreateYear}
                disabled={loading || !yearValue}
              >
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог загрузки документа */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить документ</DialogTitle>
            <DialogDescription>
              Выберите файл для загрузки (без ограничения по весу)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Файл</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Выбран: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setSelectedFile(null);
                  setSelectedYearId(null);
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleUploadDocument}
                disabled={uploading || !selectedFile || !selectedYearId}
              >
                {uploading ? "Загрузка..." : "Загрузить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

