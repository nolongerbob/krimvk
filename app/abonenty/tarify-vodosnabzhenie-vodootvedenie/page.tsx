"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function TarifyVodosnabzhenieVodootvedeniePage() {
  return (
    <div className="container py-12 px-4 max-w-6xl">
      {/* Заголовок */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Тарифы на водоснабжение и водоотведение
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Актуальные тарифы на водоснабжение и водоотведение для ООО «Крымская Водная Компания»
        </p>
      </div>

      {/* Карточка с PDF */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Приказ № 28/1 от 18 сентября 2025 года
              </CardTitle>
              <CardDescription className="text-base mt-2">
                О внесении изменений в приказ Государственного комитета по ценам и тарифам Республики Крым от 19 декабря 2023 года № 43/4 «Об установлении тарифов на водоснабжение и водоотведение обществу с ограниченной ответственностью «Крымская Водная Компания» на 2024-2028 годы»
              </CardDescription>
            </div>
            <Button asChild size="lg" className="gap-2">
              <a href="/documents/28.1-1-18.pdf" download>
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
              src="/documents/28.1-1-18.pdf"
              className="w-full h-full"
              style={{ minHeight: "800px", border: "none" }}
              title="Тарифы на водоснабжение и водоотведение"
            />
          </div>
        </CardContent>
      </Card>

      {/* Дополнительная информация */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <p className="text-sm text-gray-700">
            <strong>Примечание:</strong> Тарифы указаны в рублях за кубический метр (руб./куб. м). 
            Для населения тарифы указаны с НДС, для бюджетных организаций и прочих потребителей — без НДС.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
