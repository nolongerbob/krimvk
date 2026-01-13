"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function TarifyPodklyucheniePage() {
  return (
    <div className="container py-12 px-4 max-w-6xl">
      {/* Заголовок */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Тарифы на подключение
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Тарифы на подключение (технологическое присоединение) к централизованным системам водоснабжения и водоотведения для ООО «Крымская Водная Компания»
        </p>
      </div>

      {/* Карточка с PDF */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Приказ № 31/7 от 9 октября 2025 года
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Об установлении тарифов на подключение (технологическое присоединение) к централизованным системам водоснабжения и водоотведения общества с ограниченной ответственностью «Крымская Водная Компания» на 2026 год
              </CardDescription>
            </div>
            <Button asChild size="lg" className="gap-2">
              <a href="/documents/31.7 (1).pdf" download>
                <Download className="h-5 w-5" />
                Скачать PDF
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Встроенный просмотр PDF */}
          <div className="w-full border rounded-lg overflow-hidden bg-gray-50" style={{ minHeight: "800px" }}>
            <iframe
              src="/documents/31.7 (1).pdf"
              className="w-full h-full"
              style={{ minHeight: "800px", border: "none" }}
              title="Тарифы на подключение"
            />
          </div>
        </CardContent>
      </Card>

      {/* Дополнительная информация */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <p className="text-sm text-gray-700">
            <strong>Примечание:</strong> Тарифы указаны в тысячах рублей без учета НДС. 
            Тарифы действуют на период с 1 января 2026 года по 31 декабря 2026 года включительно.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
