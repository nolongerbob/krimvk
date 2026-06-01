import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, FolderOpen, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Лицензии и заключения",
  description:
    "Лицензии на деятельность и официальные заключения ООО «Крымская Водная Компания»",
};

export default function LicenziiPage() {
  return (
    <div className="container py-12 px-4 max-w-5xl">
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Scale className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Лицензии и заключения
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Официальные документы ООО «Крымская Водная Компания»: лицензии на виды
          деятельности и заключения по результатам проверок и экспертиз.
        </p>
      </div>

      <Card className="mb-8 animate-fade-in animate-delay-100 shadow-lg border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-amber-600" />
            <CardTitle className="text-2xl">Раздел в подготовке</CardTitle>
          </div>
          <CardDescription className="text-base text-amber-900/80">
            Документы будут опубликованы после загрузки и проверки юридическим
            отделом.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            На этой странице появятся сканы и реквизиты действующих лицензий, а
            также заключения государственных органов и экспертных организаций.
            Сейчас раздел намеренно оставлен пустым — материалы готовятся к
            публикации.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="animate-fade-in animate-delay-200 shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-xl">Лицензии</CardTitle>
            </div>
            <CardDescription>
              Разрешительная документация на водоснабжение и водоотведение
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Пока нет опубликованных документов
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Здесь будут лицензии с номером, сроком действия и ссылкой на
                скачивание.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-delay-300 shadow-lg border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-green-600" />
              <CardTitle className="text-xl">Заключения</CardTitle>
            </div>
            <CardDescription>
              Официальные заключения по проверкам и экспертизам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
              <Scale className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Пока нет опубликованных документов
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Здесь будут заключения с датой, органом выдачи и файлом для
                ознакомления.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 animate-fade-in animate-delay-400 shadow-lg">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600 text-center">
            По вопросам предоставления копий документов обращайтесь в абонентский
            отдел:{" "}
            <a
              href="mailto:sakwcompany@mail.ru"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              sakwcompany@mail.ru
            </a>
            {" · "}
            <Link href="/contact" className="text-primary hover:underline">
              Контакты
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
