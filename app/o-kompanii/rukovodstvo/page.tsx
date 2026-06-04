import Link from "next/link";
import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Building2, Award, Info, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Руководство",
  description: "Руководители и учредители ООО «Крымская Водная Компания»",
};

const emptyCardClass =
  "rounded-none border border-gray-200 border-l-4 border-l-gray-300 shadow-none";

function EmptySectionState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[11rem] flex-col items-center justify-center rounded-none border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-none bg-gray-50 ring-1 ring-gray-200/80">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

export default function RukovodstvoPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-gray-50 py-8 md:py-12 pb-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container max-w-5xl flex-1 px-4">
        <div className="mb-10 text-center animate-fade-in md:mb-12">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-none bg-blue-100">
            <User className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Руководство
          </h1>
          <p className="mx-auto max-w-3xl text-center text-base text-gray-600 md:text-lg">
            Руководители и учредители ООО «Крымская Водная Компания»
          </p>
        </div>

        <Alert className="mb-8 rounded-none border-blue-200 bg-blue-50 animate-fade-in animate-delay-100">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <span className="font-semibold">Раздел в подготовке.</span> Сведения о руководстве и
            учредителях будут опубликованы после согласования с юридическим отделом.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2 md:items-stretch md:gap-8">
          <Card className={cn(emptyCardClass, "flex h-full flex-col animate-fade-in animate-delay-200")}>
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-gray-50 ring-1 ring-gray-200/80">
                  <Award className="h-5 w-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl font-semibold">Руководители</CardTitle>
                  <CardDescription className="mt-1 min-h-[2.75rem]">
                    Генеральный директор и руководящий состав
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-0">
              <EmptySectionState
                icon={User}
                title="Информация о руководстве появится здесь"
                description="ФИО, должность и контактные данные будут размещены после публикации."
              />
            </CardContent>
          </Card>

          <Card className={cn(emptyCardClass, "flex h-full flex-col animate-fade-in animate-delay-300")}>
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-gray-50 ring-1 ring-gray-200/80">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl font-semibold">Учредители</CardTitle>
                  <CardDescription className="mt-1 min-h-[2.75rem]">
                    Сведения об учредителях компании
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-0">
              <EmptySectionState
                icon={Building2}
                title="Сведения об учредителях появятся здесь"
                description="Данные об учредителях будут опубликованы в установленном порядке."
              />
            </CardContent>
          </Card>
        </div>

        <p className="mt-10 text-center animate-fade-in animate-delay-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Вернуться на главную
          </Link>
        </p>
      </div>
    </div>
  );
}
