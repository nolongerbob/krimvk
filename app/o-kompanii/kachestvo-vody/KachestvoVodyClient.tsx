"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Droplet, FileText, Calendar, MapPin, Search, Building2 } from "lucide-react";

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
  documents: WaterQualityDocument[];
}

interface WaterQualityCity {
  id: string;
  name: string;
  years: WaterQualityYear[];
}

interface WaterQualityDistrict {
  id: string;
  name: string;
  cities: WaterQualityCity[];
}

interface KachestvoVodyClientProps {
  districts: WaterQualityDistrict[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function KachestvoVodyClient({ districts }: KachestvoVodyClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  const filteredDistricts = useMemo(() => {
    let filtered = districts;

    // Фильтр по району
    if (selectedDistrictId) {
      filtered = filtered.filter((d) => d.id === selectedDistrictId);
    }

    // Поиск по городам
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.map((district) => ({
        ...district,
        cities: district.cities.filter((city) =>
          city.name.toLowerCase().includes(query)
        ),
      })).filter((district) => district.cities.length > 0);
    }

    return filtered;
  }, [districts, searchQuery, selectedDistrictId]);

  return (
    <div className="container py-12 px-4 max-w-6xl">
      {/* Заголовок */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Droplet className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Качество питьевой воды
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Информация о качестве питьевой воды по районам, городам и годам
        </p>
      </div>

      {/* Фильтры */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Фильтр по району */}
          <div className="flex-1">
            <label htmlFor="district-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Район
            </label>
            <select
              id="district-filter"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все районы</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          {/* Поиск по городам */}
          <div className="flex-1">
            <label htmlFor="city-search" className="block text-sm font-medium text-gray-700 mb-2">
              Поиск по городам
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="city-search"
                type="text"
                placeholder="Поиск по городам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {filteredDistricts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            {searchQuery || selectedDistrictId ? (
              <p className="text-gray-500 text-lg">
                По запросу ничего не найдено
              </p>
            ) : (
              <p className="text-gray-500 text-lg">
                Информация о качестве воды пока не добавлена
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredDistricts.map((district) => (
            <Card key={district.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-2xl">{district.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {district.cities.length === 0 ? (
                  <p className="text-gray-500">Города для этого района пока не добавлены</p>
                ) : (
                  <div className="space-y-6">
                    {district.cities.map((city) => (
                      <div key={city.id} className="border-l-4 border-l-green-500 pl-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-5 w-5 text-green-600" />
                          <h3 className="text-xl font-semibold">{city.name}</h3>
                        </div>
                        {city.years.length === 0 ? (
                          <p className="text-gray-500 text-sm">Документы для этого города пока не добавлены</p>
                        ) : (
                          <div className="space-y-4">
                            {city.years.map((year) => (
                              <div key={year.id} className="border-l-4 border-l-blue-500 pl-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                  <h4 className="text-lg font-semibold">{year.year} год</h4>
                                </div>
                                {year.documents.length === 0 ? (
                                  <p className="text-gray-500 text-sm">Документы для этого года пока не добавлены</p>
                                ) : (
                                  <div className="grid gap-2 mt-3">
                                    {year.documents.map((doc) => (
                                      <a
                                        key={doc.id}
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                                      >
                                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                                            {doc.fileName}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            {formatFileSize(doc.fileSize)}
                                          </p>
                                        </div>
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                          Скачать
                                        </span>
                                      </a>
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
    </div>
  );
}
