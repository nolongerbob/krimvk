"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { cn } from "@/lib/utils";
import {
  dashboardButtonClass,
  dashboardPageClass,
} from "@/components/dashboard/dashboard-styles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Droplet,
  Plus,
  Trash2,
  Edit,
  FileText,
  Calendar,
  MapPin,
  Upload,
  Building2,
  Search,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { publicFileHref } from "@/lib/public-file-url";

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

interface WaterQualityCity {
  id: string;
  districtId: string;
  name: string;
  order: number;
  isActive: boolean;
  years: WaterQualityYear[];
  district?: { id: string; name: string };
}

interface WaterQualityDistrict {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  cities: WaterQualityCity[];
}

interface WaterQualityClientProps {
  initialDistricts: WaterQualityDistrict[];
}

const fieldClass =
  "h-10 rounded-none border-slate-200 bg-white focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500";
const outlineBtnClass = cn(
  dashboardButtonClass,
  "h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
);
const primaryBtnClass = cn(
  dashboardButtonClass,
  "h-9 bg-blue-600 text-white hover:bg-blue-700"
);
const dangerBtnClass = cn(dashboardButtonClass, "h-9");

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function WaterQualityClient({ initialDistricts }: WaterQualityClientProps) {
  const [districts, setDistricts] = useState<WaterQualityDistrict[]>(initialDistricts);
  const [loading, setLoading] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>("");

  // Диалоги
  const [districtDialogOpen, setDistrictDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<WaterQualityDistrict | null>(null);
  const [editingCity, setEditingCity] = useState<WaterQualityCity | null>(null);
  const [editingYear, setEditingYear] = useState<{ yearId: string; cityId: string } | null>(null);

  // Формы
  const [districtName, setDistrictName] = useState("");
  const [districtOrder, setDistrictOrder] = useState(0);
  const [cityName, setCityName] = useState("");
  const [cityOrder, setCityOrder] = useState(0);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [yearValue, setYearValue] = useState("");
  const [yearOrder, setYearOrder] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/water-quality/districts");
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация данных по поисковому запросу и району
  const filteredDistricts = useMemo(() => {
    let filtered = districts;

    // Фильтр по району
    if (selectedDistrictFilter) {
      filtered = filtered.filter((d) => d.id === selectedDistrictFilter);
    }

    // Поиск: при совпадении района/города показываем всё внутри, иначе — только подходящие годы/документы
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered
        .map((district) => {
          const districtMatches = district.name.toLowerCase().includes(query);

          const filteredCities = district.cities
            .map((city) => {
              const cityMatches = city.name.toLowerCase().includes(query);
              const years =
                districtMatches || cityMatches
                  ? city.years
                  : city.years.filter((year) => {
                      const yearMatches = year.year.toString().includes(query);
                      const documentMatches = year.documents.some((doc) =>
                        doc.fileName.toLowerCase().includes(query)
                      );
                      return yearMatches || documentMatches;
                    });

              return { ...city, years };
            })
            .filter((city) => {
              const cityMatches = city.name.toLowerCase().includes(query);
              return districtMatches || cityMatches || city.years.length > 0;
            });

          return {
            ...district,
            cities: districtMatches ? district.cities : filteredCities,
          };
        })
        .filter((district) => {
          const districtMatches = district.name.toLowerCase().includes(query);
          return districtMatches || district.cities.length > 0;
        });
    }

    return filtered;
  }, [districts, searchQuery, selectedDistrictFilter]);

  const handleCreateDistrict = async () => {
    if (!districtName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/water-quality/districts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: districtName,
          order: districtOrder,
        }),
      });

      if (response.ok) {
        await refreshData();
        setDistrictDialogOpen(false);
        setDistrictName("");
        setDistrictOrder(0);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при создании района");
      }
    } catch (error) {
      console.error("Error creating district:", error);
      alert("Ошибка при создании района");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDistrict = async (districtId: string) => {
    if (!districtName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/water-quality/districts/${districtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: districtName,
          order: districtOrder,
        }),
      });

      if (response.ok) {
        await refreshData();
        setDistrictDialogOpen(false);
        setEditingDistrict(null);
        setDistrictName("");
        setDistrictOrder(0);
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при обновлении района");
      }
    } catch (error) {
      console.error("Error updating district:", error);
      alert("Ошибка при обновлении района");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDistrict = async (districtId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот район? Все связанные города, годы и документы также будут удалены.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/water-quality/districts/${districtId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await refreshData();
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при удалении района");
      }
    } catch (error) {
      console.error("Error deleting district:", error);
      alert("Ошибка при удалении района");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    if (!cityName.trim() || !selectedDistrictId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/water-quality/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cityName,
          districtId: selectedDistrictId,
          order: cityOrder,
        }),
      });

      if (response.ok) {
        await refreshData();
        setCityDialogOpen(false);
        setEditingCity(null);
        setCityName("");
        setCityOrder(0);
        setSelectedDistrictId("");
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при создании города");
      }
    } catch (error) {
      console.error("Error creating city:", error);
      alert("Ошибка при создании города");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCity = async (cityId: string) => {
    if (!cityName.trim() || !selectedDistrictId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/water-quality/regions/${cityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cityName,
          districtId: selectedDistrictId,
          order: cityOrder,
        }),
      });

      if (response.ok) {
        await refreshData();
        setCityDialogOpen(false);
        setEditingCity(null);
        setCityName("");
        setCityOrder(0);
        setSelectedDistrictId("");
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при обновлении города");
      }
    } catch (error) {
      console.error("Error updating city:", error);
      alert("Ошибка при обновлении города");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот город? Все связанные годы и документы также будут удалены.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/water-quality/regions/${cityId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await refreshData();
      } else {
        const error = await response.json();
        alert(error.error || "Ошибка при удалении города");
      }
    } catch (error) {
      console.error("Error deleting city:", error);
      alert("Ошибка при удалении города");
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
          cityId: editingYear.cityId,
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
        alert("Год успешно добавлен");
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
        const fileInput = document.getElementById("file-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else if (response.status === 413) {
        alert(
          "Файл не принят сервером (лимит размера). Нужны nginx 200M, npm run build после обновления next.config, или сожмите PDF до 50 МБ."
        );
      } else {
        let message = "Ошибка при загрузке файла";
        try {
          const error = await response.json();
          console.error("Upload error response:", error);
          message = error.error || message;
        } catch {
          console.error("Upload error, status:", response.status);
        }
        alert(message);
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

  const openDistrictDialog = (district?: WaterQualityDistrict) => {
    if (district) {
      setEditingDistrict(district);
      setDistrictName(district.name);
      setDistrictOrder(district.order);
    } else {
      setEditingDistrict(null);
      setDistrictName("");
      setDistrictOrder(0);
    }
    setDistrictDialogOpen(true);
  };

  const openCityDialog = (districtId: string, city?: WaterQualityCity) => {
    if (city) {
      setEditingCity(city);
      setCityName(city.name);
      setCityOrder(city.order);
      setSelectedDistrictId(city.districtId);
    } else {
      setEditingCity(null);
      setCityName("");
      setCityOrder(0);
      setSelectedDistrictId(districtId);
    }
    setCityDialogOpen(true);
  };

  const openYearDialog = (cityId: string) => {
    setEditingYear({ yearId: "", cityId });
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
    <div
      className={cn(
        dashboardPageClass,
        "container max-w-6xl px-4 py-8 [&_button]:!rounded-none [&_input]:!rounded-none [&_select]:!rounded-none"
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
            Управление качеством питьевой воды
          </h1>
          <p className="text-sm text-slate-600">
            Создание районов, городов, годов и загрузка документов
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            onClick={() => openDistrictDialog()}
            disabled={loading}
            className={primaryBtnClass}
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать район
          </Button>
          <Button asChild variant="outline" className={outlineBtnClass}>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="search" className="mb-1.5 text-sm text-slate-700">
            Поиск
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="search"
              type="text"
              placeholder="Районы, города, годы, документы…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(fieldClass, "pl-9")}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="district-filter" className="mb-1.5 text-sm text-slate-700">
            Фильтр по району
          </Label>
          <select
            id="district-filter"
            value={selectedDistrictFilter}
            onChange={(e) => setSelectedDistrictFilter(e.target.value)}
            className={cn(fieldClass, "w-full px-3")}
          >
            <option value="">Все районы</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredDistricts.length === 0 ? (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <Droplet className="mx-auto mb-4 h-10 w-10 text-slate-400" strokeWidth={1.75} />
            <p className="mb-4 text-sm text-slate-600">
              {searchQuery || selectedDistrictFilter
                ? "По запросу ничего не найдено"
                : "Нет районов"}
            </p>
            {!searchQuery && !selectedDistrictFilter ? (
              <Button onClick={() => openDistrictDialog()} className={primaryBtnClass}>
                <Plus className="mr-2 h-4 w-4" />
                Создать первый район
              </Button>
            ) : null}
          </DashboardCardBody>
        </DashboardCard>
      ) : (
        <div className="space-y-4">
          {filteredDistricts.map((district) => (
            <DashboardCard key={district.id}>
              <DashboardCardBody className="p-0">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
                    <h2 className="text-lg font-semibold text-slate-900">
                      {district.name}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDistrictDialog(district)}
                      disabled={loading}
                      className={outlineBtnClass}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCityDialog(district.id)}
                      disabled={loading}
                      className={outlineBtnClass}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Город
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDistrict(district.id)}
                      disabled={loading}
                      className={dangerBtnClass}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
                  {district.cities.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Города для этого района пока не добавлены
                    </p>
                  ) : (
                    district.cities.map((city) => (
                      <div
                        key={city.id}
                        className="border border-slate-200 bg-white"
                      >
                        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
                            <h3 className="text-base font-semibold text-slate-900">
                              {city.name}
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCityDialog(district.id, city)}
                              disabled={loading}
                              className={outlineBtnClass}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Изменить
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openYearDialog(city.id)}
                              disabled={loading}
                              className={outlineBtnClass}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Год
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCity(city.id)}
                              disabled={loading}
                              className={dangerBtnClass}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {city.years.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-slate-500">
                            Годы для этого города пока не добавлены
                          </p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {city.years.map((year) => (
                              <div key={year.id} className="px-4 py-4">
                                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar
                                      className="h-4 w-4 text-slate-500"
                                      strokeWidth={1.75}
                                    />
                                    <h4 className="text-sm font-semibold text-slate-900">
                                      {year.year} год
                                    </h4>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openUploadDialog(year.id)}
                                      disabled={loading}
                                      className={outlineBtnClass}
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      Загрузить
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteYear(year.id)}
                                      disabled={loading}
                                      className={dangerBtnClass}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {year.documents.length === 0 ? (
                                  <p className="text-xs text-slate-500">
                                    Документы для этого года пока не загружены
                                  </p>
                                ) : (
                                  <ul className="space-y-2">
                                    {year.documents.map((doc) => (
                                      <li
                                        key={doc.id}
                                        className="flex items-center gap-3 rounded-none border border-slate-200 bg-white px-3 py-2.5"
                                      >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-blue-100">
                                          <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <a
                                            href={publicFileHref(doc.fileUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block truncate text-sm font-medium text-slate-900 hover:text-blue-600"
                                          >
                                            {doc.fileName}
                                          </a>
                                          <p className="text-xs text-slate-500">
                                            {formatFileSize(doc.fileSize)}
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteDocument(doc.id)}
                                          disabled={loading}
                                          className={cn(
                                            dashboardButtonClass,
                                            "h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                          )}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </DashboardCardBody>
            </DashboardCard>
          ))}
        </div>
      )}

      {/* Диалог создания/редактирования района */}
      <Dialog open={districtDialogOpen} onOpenChange={setDistrictDialogOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDistrict ? "Редактировать район" : "Создать район"}
            </DialogTitle>
            <DialogDescription>
              {editingDistrict
                ? "Измените данные района"
                : "Добавьте новый район"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="district-name">Название района</Label>
              <Input
                id="district-name"
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                placeholder="Например: Сакский район"
                className={fieldClass}
              />
            </div>
            <div>
              <Label htmlFor="district-order">Порядок отображения</Label>
              <Input
                id="district-order"
                type="number"
                value={districtOrder}
                onChange={(e) => setDistrictOrder(parseInt(e.target.value) || 0)}
                className={fieldClass}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDistrictDialogOpen(false);
                  setEditingDistrict(null);
                  setDistrictName("");
                  setDistrictOrder(0);
                }}
                className={outlineBtnClass}
              >
                Отмена
              </Button>
              <Button
                onClick={() => {
                  if (editingDistrict) {
                    handleUpdateDistrict(editingDistrict.id);
                  } else {
                    handleCreateDistrict();
                  }
                }}
                disabled={loading || !districtName.trim()}
                className={primaryBtnClass}
              >
                {editingDistrict ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог создания/редактирования города */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCity ? "Редактировать город" : "Создать город"}
            </DialogTitle>
            <DialogDescription>
              {editingCity
                ? "Измените данные города"
                : "Добавьте новый город в выбранный район"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="city-district">Район</Label>
              <select
                id="city-district"
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className={cn(fieldClass, "w-full px-3")}
                disabled={!!editingCity}
              >
                <option value="">Выберите район</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="city-name">Название города</Label>
              <Input
                id="city-name"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Например: Симферополь"
                className={fieldClass}
              />
            </div>
            <div>
              <Label htmlFor="city-order">Порядок отображения</Label>
              <Input
                id="city-order"
                type="number"
                value={cityOrder}
                onChange={(e) => setCityOrder(parseInt(e.target.value) || 0)}
                className={fieldClass}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCityDialogOpen(false);
                  setEditingCity(null);
                  setCityName("");
                  setCityOrder(0);
                  setSelectedDistrictId("");
                }}
                className={outlineBtnClass}
              >
                Отмена
              </Button>
              <Button
                onClick={() => {
                  if (editingCity) {
                    handleUpdateCity(editingCity.id);
                  } else {
                    handleCreateCity();
                  }
                }}
                disabled={loading || !cityName.trim() || !selectedDistrictId}
                className={primaryBtnClass}
              >
                {editingCity ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог создания года */}
      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить год</DialogTitle>
            <DialogDescription>
              Добавьте новый год для выбранного города
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
                className={fieldClass}
              />
            </div>
            <div>
              <Label htmlFor="year-order">Порядок отображения</Label>
              <Input
                id="year-order"
                type="number"
                value={yearOrder}
                onChange={(e) => setYearOrder(parseInt(e.target.value) || 0)}
                className={fieldClass}
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
                className={outlineBtnClass}
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreateYear}
                disabled={loading || !yearValue}
                className={primaryBtnClass}
              >
                Создать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог загрузки документа */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
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
                className={cn(fieldClass, "cursor-pointer")}
              />
              {selectedFile ? (
                <p className="mt-2 text-sm text-slate-500">
                  Выбран: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setSelectedFile(null);
                  setSelectedYearId(null);
                }}
                className={outlineBtnClass}
              >
                Отмена
              </Button>
              <Button
                onClick={handleUploadDocument}
                disabled={uploading || !selectedFile || !selectedYearId}
                className={primaryBtnClass}
              >
                {uploading ? "Загрузка…" : "Загрузить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
