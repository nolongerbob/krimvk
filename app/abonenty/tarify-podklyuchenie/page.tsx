"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Plug } from "lucide-react";
import { formatFileSizeRu } from "@/lib/format-file";

const PDF_PATH = "/documents/31.7 (1).pdf";
const PDF_SIZE = 212379;

export default function TarifyPodklyucheniePage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-gray-50 py-8 md:py-12 pb-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container max-w-6xl flex-1 px-4">
        <div className="mb-8 text-center animate-fade-in md:mb-10">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-none bg-blue-100">
            <Plug className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Тарифы на подключение
          </h1>
          <p className="mx-auto max-w-3xl text-center text-base text-gray-600 md:text-lg">
            Тарифы на подключение (технологическое присоединение) к централизованным системам
            водоснабжения и водоотведения для ООО «Крымская Водная Компания»
          </p>
        </div>

        <Card className="group mb-6 rounded-none border border-gray-200 shadow-none transition-all duration-200 hover:border-blue-500">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl font-semibold md:text-2xl">
                    Приказ № 31/7 от 9 октября 2025 года
                  </CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    PDF, {formatFileSizeRu(PDF_SIZE)}
                  </p>
                  <CardDescription className="mt-2 text-base">
                    Об установлении тарифов на подключение (технологическое присоединение) к
                    централизованным системам водоснабжения и водоотведения общества с ограниченной
                    ответственностью «Крымская Водная Компания» на 2026 год
                  </CardDescription>
                </div>
              </div>
              <Button
                asChild
                className="w-fit shrink-0 gap-2 rounded-none bg-blue-600 hover:bg-blue-700 hover:scale-100 active:scale-100"
              >
                <a href={PDF_PATH} download="Тарифы на подключение.pdf">
                  <Download className="h-4 w-4 transition-colors group-hover:text-white" />
                  Скачать PDF
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="w-full overflow-hidden rounded-none border border-gray-200 bg-gray-50"
              style={{ minHeight: "800px" }}
            >
              <iframe
                src={PDF_PATH}
                className="h-full w-full"
                style={{ minHeight: "800px", border: "none" }}
                title="Тарифы на подключение"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-blue-200 bg-blue-50 shadow-none">
          <CardContent className="p-6">
            <p className="text-sm text-gray-700">
              <strong>Примечание:</strong> Тарифы указаны в тысячах рублей без учёта НДС. Тарифы
              действуют на период с 1 января 2026 года по 31 декабря 2026 года включительно.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
