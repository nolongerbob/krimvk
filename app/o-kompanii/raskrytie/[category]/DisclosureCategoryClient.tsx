"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Search } from "lucide-react";
import {
  DisclosureDocumentCard,
  type DisclosureDocumentItem,
} from "@/components/DisclosureDocumentCard";

interface DisclosureCategoryClientProps {
  category: string;
  categoryInfo: {
    title: string;
    description: string;
  };
  initialDocuments: DisclosureDocumentItem[];
}

export function DisclosureCategoryClient({
  category,
  categoryInfo,
  initialDocuments,
}: DisclosureCategoryClientProps) {
  const [documents, setDocuments] = useState<DisclosureDocumentItem[]>(
    Array.isArray(initialDocuments) ? initialDocuments : []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setLoading(true);
        fetch(`/api/disclosure?category=${category}&search=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            setDocuments(Array.isArray(data) ? data : []);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error searching:", error);
            setDocuments([]);
            setLoading(false);
          });
      } else {
        fetch(`/api/disclosure?category=${category}`)
          .then((res) => res.json())
          .then((data) => {
            setDocuments(Array.isArray(data) ? data : []);
          })
          .catch((error) => {
            console.error("Error fetching:", error);
            setDocuments([]);
          });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, category]);

  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    if (!searchQuery.trim()) return documents;

    const query = searchQuery.toLowerCase().trim();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.fileName.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-gray-50 py-8 md:py-12 pb-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container max-w-6xl flex-1 px-4">
        <div className="mb-10 text-center animate-fade-in md:mb-12">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-none bg-blue-100">
            <FileText className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            {categoryInfo.title}
          </h1>
          <p className="mx-auto max-w-3xl text-center text-base text-gray-600 md:text-lg">
            {categoryInfo.description}
          </p>
        </div>

        <div className="mb-8">
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по названию документа..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-none py-6 pl-10 text-base md:text-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">Поиск...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="rounded-none border border-gray-200 shadow-none">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-gray-100">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500">
                {searchQuery ? "Документы не найдены" : "Документы отсутствуют"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <DisclosureDocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
