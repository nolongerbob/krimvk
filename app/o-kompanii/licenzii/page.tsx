import Link from "next/link";
import { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Scale, Mail, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";

export const metadata: Metadata = {
  title: "Лицензии и заключения",
  description:
    "Лицензии на деятельность и официальные заключения ООО «Крымская Водная Компания»",
};

const emptyCardClass =
  "rounded-none border border-slate-200 border-l-4 border-l-gray-300 shadow-none";

function EmptyDocumentState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[11rem] flex-col items-center justify-center rounded-none border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-none bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function LicenziiPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-slate-50 py-8 md:py-12 pb-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container max-w-5xl flex-1 px-4">
        <div className="mb-10 text-center animate-fade-in md:mb-12">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-none bg-blue-100">
            <Scale className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Лицензии и заключения
          </h1>
          <p className="mx-auto max-w-3xl text-center text-base text-slate-600 md:text-lg">
            Официальные документы ООО «Крымская Водная Компания»: лицензии на виды деятельности и
            заключения по результатам проверок и экспертиз.
          </p>
        </div>

        <Alert className="mb-8 rounded-none border-blue-200 bg-blue-50 animate-fade-in animate-delay-100">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <span className="font-semibold">Раздел в подготовке.</span> Документы будут опубликованы
            после загрузки и проверки юридическим отделом. На этой странице появятся сканы и
            реквизиты действующих лицензий, а также заключения государственных органов и экспертных
            организаций.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2 md:items-stretch md:gap-8">
          <DashboardCard className={cn(emptyCardClass, "flex h-full flex-col animate-fade-in animate-delay-200")}>
            <div className="pb-4 p-6 pb-4" >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-slate-100">
                  <FileText className="h-5 w-5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold">Лицензии</h2>
                  <p className="mt-1 min-h-[2.75rem]">
                    Разрешительная документация на водоснабжение и водоотведение
                  </p>
                </div>
              </div>
            </div>
            <DashboardCardBody className="flex flex-1 flex-col pt-0">
              <EmptyDocumentState
                icon={FileText}
                title="Пока нет опубликованных документов"
                description="Здесь будут лицензии с номером, сроком действия и ссылкой на скачивание."
              />
            </DashboardCardBody>
          </DashboardCard>

          <DashboardCard className={cn(emptyCardClass, "flex h-full flex-col animate-fade-in animate-delay-300")}>
            <div className="pb-4 p-6 pb-4" >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-slate-100">
                  <Scale className="h-5 w-5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold">Заключения</h2>
                  <p className="mt-1 min-h-[2.75rem]">
                    Официальные заключения по проверкам и экспертизам
                  </p>
                </div>
              </div>
            </div>
            <DashboardCardBody className="flex flex-1 flex-col pt-0">
              <EmptyDocumentState
                icon={Scale}
                title="Пока нет опубликованных документов"
                description="Здесь будут заключения с датой, органом выдачи и файлом для ознакомления."
              />
            </DashboardCardBody>
          </DashboardCard>
        </div>

        <div className="mt-8 rounded-none border border-slate-200 bg-white px-6 py-6 text-center animate-fade-in animate-delay-400">
          <p className="text-sm text-slate-600">
            По вопросам предоставления копий документов обращайтесь в абонентский отдел:
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
            <a
              href="mailto:sakwcompany@mail.ru"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>sakwcompany@mail.ru</span>
            </a>
            <span className="hidden text-slate-300 sm:inline" aria-hidden>
              ·
            </span>
            <Link href="/contact" className="text-blue-600 hover:underline">
              Контакты
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
