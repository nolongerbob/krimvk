"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Droplet, FileText, Calendar, MapPin, Search } from "lucide-react";

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

interface WaterQualityRegion {
  id: string;
  name: string;
  years: WaterQualityYear[];
}

interface KachestvoVodyClientProps {
  regions: WaterQualityRegion[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function KachestvoVodyClient({ regions }: KachestvoVodyClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) {
      return regions;
    }

    const query = searchQuery.toLowerCase().trim();
    return regions.filter((region) =>
      region.name.toLowerCase().includes(query)
    );
  }, [regions, searchQuery]);

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
          Информация о качестве питьевой воды по городам и годам
        </p>
      </div>

      {/* Поиск */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск по городам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredRegions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            {searchQuery ? (
              <p className="text-gray-500 text-lg">
                По запросу "{searchQuery}" ничего не найдено
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
          {filteredRegions.map((region) => (
            <Card key={region.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-2xl">{region.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {region.years.length === 0 ? (
                  <p className="text-gray-500">Документы для этого региона пока не добавлены</p>
                ) : (
                  <div className="space-y-6">
                    {region.years.map((year) => (
                      <div key={year.id} className="border-l-4 border-l-blue-500 pl-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <h3 className="text-xl font-semibold">{year.year} год</h3>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

