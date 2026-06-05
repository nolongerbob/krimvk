"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Droplet, FileText, Calendar, MapPin, Search, Building2 } from "lucide-react";
import { publicFileHref } from "@/lib/public-file-url";
import { cn } from "@/lib/utils";

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

const cardClass = "rounded-none border border-gray-200 shadow-none";
const fieldClass =
  "h-10 rounded-none border-gray-200 bg-white focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500";

function countCityDocuments(city: WaterQualityCity) {
  return city.years.reduce((sum, year) => sum + year.documents.length, 0);
}

function countDistrictDocuments(district: WaterQualityDistrict) {
  return district.cities.reduce((sum, city) => sum + countCityDocuments(city), 0);
}

function pluralDocuments(count: number) {
  if (count === 1) return "документ";
  if (count > 1 && count < 5) return "документа";
  return "документов";
}

function pluralSettlements(count: number) {
  if (count === 1) return "населённый пункт";
  if (count > 1 && count < 5) return "населённых пункта";
  return "населённых пунктов";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function KachestvoVodyClient({ districts }: KachestvoVodyClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("all");
  const [openDistrictIds, setOpenDistrictIds] = useState<string[]>([]);
  const [openCityIds, setOpenCityIds] = useState<string[]>([]);

  const filteredDistricts = useMemo(() => {
    let filtered = districts;

    if (selectedDistrictId && selectedDistrictId !== "all") {
      filtered = filtered.filter((d) => d.id === selectedDistrictId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered
        .map((district) => ({
          ...district,
          cities: district.cities.filter((city) =>
            city.name.toLowerCase().includes(query)
          ),
        }))
        .filter((district) => district.cities.length > 0);
    }

    return filtered;
  }, [districts, searchQuery, selectedDistrictId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setOpenDistrictIds(filteredDistricts.map((district) => district.id));
      setOpenCityIds(
        filteredDistricts.flatMap((district) => district.cities.map((city) => city.id))
      );
      return;
    }

    setOpenDistrictIds([]);
    setOpenCityIds([]);
  }, [searchQuery, filteredDistricts]);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-gray-50 py-8 md:py-12 pb-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container max-w-5xl flex-1 px-4">
        <div className="mb-10 text-center animate-fade-in md:mb-12">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-none bg-blue-100">
            <Droplet className="h-7 w-7 text-blue-600" strokeWidth={1.75} />
          </div>
          <h1 className="mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Качество питьевой воды
          </h1>
          <p className="mx-auto max-w-3xl text-center text-base text-gray-600 md:text-lg">
            Отчёты и документы о качестве питьевой воды по районам, населённым пунктам и
            годам
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="district-filter" className="mb-1.5 text-sm text-gray-700">
              Район
            </Label>
            <Select value={selectedDistrictId} onValueChange={setSelectedDistrictId}>
              <SelectTrigger id="district-filter" className={fieldClass}>
                <SelectValue placeholder="Все районы" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-gray-200">
                <SelectItem value="all">Все районы</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="city-search" className="mb-1.5 text-sm text-gray-700">
              Поиск по населённым пунктам
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="city-search"
                type="text"
                placeholder="Введите название…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(fieldClass, "pl-9")}
              />
            </div>
          </div>
        </div>

        {filteredDistricts.length === 0 ? (
          <Card className={cn(cardClass, "py-12 text-center")}>
            <CardContent>
              <FileText className="mx-auto mb-4 h-10 w-10 text-gray-400" strokeWidth={1.75} />
              <p className="text-sm text-gray-600">
                {searchQuery || (selectedDistrictId && selectedDistrictId !== "all")
                  ? "По запросу ничего не найдено"
                  : "Информация о качестве питьевой воды пока не добавлена"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion
            type="multiple"
            value={openDistrictIds}
            onValueChange={setOpenDistrictIds}
            className="space-y-2"
          >
            {filteredDistricts.map((district) => {
              const settlementCount = district.cities.length;
              const docCount = countDistrictDocuments(district);

              return (
                <AccordionItem
                  key={district.id}
                  value={district.id}
                  className={cn(cardClass, "border-b last:border-b")}
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-gray-100">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-left">
                      <Building2
                        className="h-5 w-5 shrink-0 text-blue-600"
                        strokeWidth={1.75}
                      />
                      <span className="text-lg font-semibold text-gray-900">
                        {district.name}
                      </span>
                      {settlementCount > 0 ? (
                        <span className="text-xs font-normal text-gray-500">
                          {settlementCount} {pluralSettlements(settlementCount)}
                        </span>
                      ) : null}
                      {docCount > 0 ? (
                        <span className="text-xs font-normal text-gray-500">
                          · {docCount} {pluralDocuments(docCount)}
                        </span>
                      ) : null}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-0">
                    {district.cities.length === 0 ? (
                      <p className="py-2 text-sm text-gray-500">
                        Населённые пункты для этого района пока не добавлены
                      </p>
                    ) : (
                      <Accordion
                        type="multiple"
                        value={openCityIds}
                        onValueChange={setOpenCityIds}
                        className="space-y-2"
                      >
                        {district.cities.map((city) => {
                          const cityDocCount = countCityDocuments(city);

                          return (
                            <AccordionItem
                              key={city.id}
                              value={city.id}
                              className="rounded-none border border-gray-200 border-b last:border-b"
                            >
                              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50/80 [&[data-state=open]]:border-b [&[data-state=open]]:border-gray-100">
                                <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                  <MapPin
                                    className="h-4 w-4 shrink-0 text-gray-500"
                                    strokeWidth={1.75}
                                  />
                                  <span className="text-base font-semibold text-gray-900">
                                    {city.name}
                                  </span>
                                  {cityDocCount > 0 ? (
                                    <span className="shrink-0 text-xs font-normal text-gray-500">
                                      {cityDocCount} {pluralDocuments(cityDocCount)}
                                    </span>
                                  ) : null}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-0 pb-0">
                                {city.years.length === 0 ? (
                                  <p className="px-4 py-4 text-sm text-gray-500">
                                    Документы для этого населённого пункта пока не
                                    добавлены
                                  </p>
                                ) : (
                                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                                    {city.years.map((year) => (
                                      <div key={year.id} className="px-4 py-4">
                                        <div className="mb-3 flex items-center gap-2">
                                          <Calendar
                                            className="h-4 w-4 text-gray-500"
                                            strokeWidth={1.75}
                                          />
                                          <h4 className="text-sm font-semibold text-gray-900">
                                            {year.year} год
                                          </h4>
                                        </div>

                                        {year.documents.length === 0 ? (
                                          <p className="text-sm text-gray-500">
                                            Документы за этот год пока не добавлены
                                          </p>
                                        ) : (
                                          <ul className="space-y-2">
                                            {year.documents.map((doc) => (
                                              <li key={doc.id}>
                                                <a
                                                  href={publicFileHref(doc.fileUrl)}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="group flex items-center gap-3 rounded-none border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-blue-500 hover:bg-blue-50/40"
                                                >
                                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-700">
                                                      {doc.fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                      {formatFileSize(doc.fileSize)}
                                                    </p>
                                                  </div>
                                                  <span className="shrink-0 text-xs font-medium text-gray-400 group-hover:text-blue-600">
                                                    Скачать
                                                  </span>
                                                </a>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
