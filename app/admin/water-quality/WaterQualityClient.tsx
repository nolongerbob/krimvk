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
} from "@/components/ui/dialog";
import { Droplet, Plus, Trash2, Edit, FileText, Calendar, MapPin, Upload, Building2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

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

    // Поиск по районам, городам и годам
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered
        .map((district) => {
          // Проверяем, совпадает ли название района
          const districtMatches = district.name.toLowerCase().includes(query);

          // Фильтруем города
          const filteredCities = district.cities
            .map((city) => {
              // Проверяем, совпадает ли название города
              const cityMatches = city.name.toLowerCase().includes(query);

              // Фильтруем годы
              const filteredYears = city.years.filter((year) => {
                // Проверяем, совпадает ли год
                const yearMatches = year.year.toString().includes(query);
                // Проверяем документы
                const documentMatches = year.documents.some((doc) =>
                  doc.fileName.toLowerCase().includes(query)
                );
                return yearMatches || documentMatches;
              });

              return {
                ...city,
                years: filteredYears,
              };
            })
            .filter((city) => {
              const cityMatches = city.name.toLowerCase().includes(query);
              return cityMatches || city.years.length > 0;
            });

          return {
            ...district,
            cities: filteredCities,
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
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление качеством питьевой воды</h1>
          <p className="text-gray-600">Создание районов, городов, годов и загрузка документов</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => openDistrictDialog()} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Создать район
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Поиск */}
          <div className="flex-1">
            <Label htmlFor="search">Поиск</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Поиск по районам, городам, годам, документам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Фильтр по району */}
          <div className="flex-1">
            <Label htmlFor="district-filter">Фильтр по району</Label>
            <select
              id="district-filter"
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      </div>

      {filteredDistricts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedDistrictFilter
                ? "По запросу ничего не найдено"
                : "Нет районов"}
            </p>
            {!searchQuery && !selectedDistrictFilter && (
              <Button onClick={() => openDistrictDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Создать первый район
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredDistricts.map((district) => (
            <Card key={district.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-2xl">{district.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDistrictDialog(district)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCityDialog(district.id)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить город
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDistrict(district.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {district.cities.length === 0 ? (
                  <p className="text-gray-500">Города для этого района пока не добавлены</p>
                ) : (
                  <div className="space-y-4">
                    {district.cities.map((city) => (
                      <div key={city.id} className="border-l-4 border-l-green-500 pl-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-green-600" />
                            <h3 className="text-xl font-semibold">{city.name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCityDialog(district.id, city)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Редактировать
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openYearDialog(city.id)}
                              disabled={loading}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Добавить год
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCity(city.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {city.years.length === 0 ? (
                          <p className="text-gray-500 text-sm">Годы для этого города пока не добавлены</p>
                        ) : (
                          <div className="space-y-3 mt-3">
                            {city.years.map((year) => (
                              <div key={year.id} className="border-l-4 border-l-blue-500 pl-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-semibold">{year.year} год</h4>
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
                                  <p className="text-gray-500 text-xs">Документы для этого года пока не загружены</p>
                                ) : (
                                  <div className="grid gap-2 mt-2">
                                    {year.documents.map((doc) => (
                                      <div
                                        key={doc.id}
                                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                                      >
                                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <a
                                            href={doc.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-gray-900 hover:text-blue-600 truncate block text-sm"
                                          >
                                            {doc.fileName}
                                          </a>
                                          <p className="text-xs text-gray-500">
                                            {formatFileSize(doc.fileSize)}
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteDocument(doc.id)}
                                          disabled={loading}
                                        >
                                          <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
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

      {/* Диалог создания/редактирования района */}
      <Dialog open={districtDialogOpen} onOpenChange={setDistrictDialogOpen}>
        <DialogContent>
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
              />
            </div>
            <div>
              <Label htmlFor="district-order">Порядок отображения</Label>
              <Input
                id="district-order"
                type="number"
                value={districtOrder}
                onChange={(e) => setDistrictOrder(parseInt(e.target.value) || 0)}
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
              >
                {editingDistrict ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог создания/редактирования города */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              />
            </div>
            <div>
              <Label htmlFor="city-order">Порядок отображения</Label>
              <Input
                id="city-order"
                type="number"
                value={cityOrder}
                onChange={(e) => setCityOrder(parseInt(e.target.value) || 0)}
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
              >
                {editingCity ? "Сохранить" : "Создать"}
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
