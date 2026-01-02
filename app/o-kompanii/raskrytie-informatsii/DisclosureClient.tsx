"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download, Calendar } from "lucide-react";

interface DisclosureDocument {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DisclosureClient({ initialDocuments }: DisclosureClientProps) {
  const [documents, setDocuments] = useState<DisclosureDocument[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Поиск на сервере при изменении запроса
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setLoading(true);
        fetch(`/api/disclosure?search=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            setDocuments(data);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error searching:", error);
            setLoading(false);
          });
      } else {
        setDocuments(initialDocuments);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, initialDocuments]);

  // Локальная фильтрация для быстрого отклика
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    
    const query = searchQuery.toLowerCase().trim();
    return documents.filter((doc) =>
      doc.title.toLowerCase().includes(query) ||
      doc.fileName.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  return (
    <div className="container py-12 px-4 max-w-6xl">
      {/* Заголовок */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <FileText className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Раскрытие информации
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Документы и отчеты в соответствии с требованиями законодательства
        </p>
      </div>

      {/* Поиск */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Поиск по названию документа..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-lg"
          />
        </div>
      </div>

      {/* Список документов */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Поиск...</p>
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
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="flex-1">{doc.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{doc.fileName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Скачать
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

