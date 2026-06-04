export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Phone,
  CheckCircle,
  DollarSign,
  FileText,
  Users,
  Award,
  Shield,
  Heart,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const sectionCardClass = "mb-8 rounded-none border border-gray-200 border-l-4 border-l-blue-600 shadow-none";
const benefitCategoryClass =
  "flex h-full rounded-none border border-gray-200 bg-white p-4";

const benefitCategories = [
  {
    icon: Award,
    title: "Ветераны",
    description:
      "ВОВ, участники боевых действий (статус на 21.02.2014), а также лица, которым на 02.09.1945 было менее 18 лет.",
  },
  {
    icon: Shield,
    title: "Пострадавшие от аварий",
    description: "Ликвидаторы ЧАЭС и приравненные категории.",
  },
  {
    icon: Heart,
    title: "Люди с инвалидностью",
    description: "Инвалиды всех групп и семьи, воспитывающие детей-инвалидов.",
  },
  {
    icon: Users,
    title: "Семьи",
    description: "Многодетные семьи.",
  },
  {
    icon: FileText,
    title: "Пострадавшие от репрессий",
    description: "Реабилитированные лица.",
  },
  {
    icon: Users,
    title: "Пенсионеры",
    description:
      "Одиноко проживающие (или живущие в семье из неработающих пенсионеров), получающие федеральную социальную доплату к пенсии.",
  },
] as const;

export default async function OtkachkaPage() {
  const service = await prisma.service.findFirst({
    where: {
      title: {
        contains: "Откачка",
      },
      isActive: true,
    },
  });

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-gray-50 py-8 md:py-12 pb-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container max-w-5xl flex-1 px-4">
        <div className="mb-10 text-center animate-fade-in md:mb-12">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-none bg-blue-100">
            <Truck className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Откачка и вывоз сточных вод
          </h1>
          <p className="mx-auto max-w-3xl text-base text-gray-600 md:text-lg">
            Для домов, не подключенных к центральной канализации
          </p>
        </div>

        <Card className="mb-8 rounded-none border border-blue-200 bg-blue-50 shadow-none animate-fade-in animate-delay-100">
          <CardContent className="p-6 md:p-8">
            <p className="text-center text-base leading-relaxed text-gray-700 md:text-lg">
              Мы предоставляем услуги ассенизатора по{" "}
              <strong>специальным социальным тарифам</strong> для населения. Работаем официально,
              быстро и аккуратно.
            </p>
          </CardContent>
        </Card>

        <Card className={cn(sectionCardClass, "animate-fade-in animate-delay-200")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold md:text-2xl">
                  Стоимость услуг (Социальный тариф)
                </CardTitle>
                <CardDescription className="mt-1 text-base">
                  Цены действуют с 01.03.2025 г.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-none border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-gray-700">
                <strong>Тариф зависит от объема цистерны и удаленности вашего объекта:</strong>
              </p>
              <p className="text-sm text-gray-600">
                Объем вывоза за один рейс зависит от вашей заявки и доступности свободного
                спецтранспорта.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Точную стоимость уточняйте при оформлении заявки</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(sectionCardClass, "animate-fade-in animate-delay-300")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold md:text-2xl">Как заказать услугу?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-blue-100">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Подайте заявку</h3>
                    <p className="text-gray-700">
                      Заявки принимаются круглосуточно. Позвоните в диспетчерскую:
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <a
                      href="tel:+79787013050"
                      className="inline-flex items-center gap-2 font-medium text-gray-900 transition-colors hover:text-blue-600"
                    >
                      <Phone className="h-4 w-4 text-blue-600" />
                      +7 (978) 701-30-50
                    </a>
                    <a
                      href="tel:+79787460990"
                      className="inline-flex items-center gap-2 font-medium text-gray-900 transition-colors hover:text-blue-600"
                    >
                      <Phone className="h-4 w-4 text-blue-600" />
                      +7 (978) 746-09-90
                    </a>
                  </div>
                  {service && (
                    <>
                      <p className="text-sm text-gray-500">или</p>
                      <Button
                        asChild
                        className="w-fit gap-2 rounded-none bg-blue-600 hover:bg-blue-700 hover:scale-100 active:scale-100"
                      >
                        <Link href={`/services/${service.id}/apply`}>
                          <FileCheck className="h-4 w-4" />
                          Оставить заявку в ЛК
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-blue-100">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold">Согласуйте время</h3>
                  <p className="text-gray-700">
                    Оператор уточнит детали. Обычно мы приезжаем в течение{" "}
                    <strong>2-х дней</strong> после заявки (при наличии свободной техники).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-blue-100">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold">Оплатите</h3>
                  <p className="text-gray-700">
                    Оплата производится на тот же <strong>лицевой счет</strong>, по которому вы
                    платите за воду.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-blue-100">
                  <span className="text-sm font-bold text-blue-600">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold">Встретьте машину</h3>
                  <p className="text-gray-700">
                    Вам нужно быть дома, чтобы подписать <strong>акт выполненных работ</strong>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(sectionCardClass, "animate-fade-in animate-delay-400")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold md:text-2xl">
                  Что требуется от вас?
                </CardTitle>
                <CardDescription className="mt-1 text-base">
                  Чтобы мы могли оказать услугу быстро и качественно, пожалуйста:
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Обеспечьте свободный проезд техники к месту выкачки.",
                "Предоставьте доступ к люку (для прокладки шлангов).",
                "Лично присутствуйте при проведении работ.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card
          className={cn(
            sectionCardClass,
            "border-l-gray-400 bg-gray-50/80 animate-fade-in animate-delay-500"
          )}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-gray-200">
                <Award className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold md:text-2xl">
                  Льготы и компенсации
                </CardTitle>
                <CardDescription className="mt-1 text-base">
                  Государственная поддержка для граждан в трудной жизненной ситуации
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-none border border-gray-200 bg-white p-4">
              <p className="text-gray-700">
                Согласно <strong>Постановлению Совета Министров РК №80</strong>, вы можете получить
                материальную помощь (компенсацию расходов) на услуги вывоза стоков, если у вас
                заключен договор с ООО «Крымская Водная Компания».
              </p>
            </div>

            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5 text-gray-600" />
                Кто имеет право на помощь:
              </h3>
              <div className="grid items-stretch gap-4 md:grid-cols-2">
                {benefitCategories.map(({ icon: Icon, title, description }) => (
                  <div key={title} className={benefitCategoryClass}>
                    <div className="flex h-full items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
                      <div>
                        <p className="mb-1 font-semibold text-gray-900">{title}</p>
                        <p className="text-sm text-gray-600">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="animate-fade-in animate-delay-600">
          <Card className="rounded-none border border-gray-200 bg-white shadow-none">
            <CardContent className="flex flex-col items-center gap-5 p-6 text-center md:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-none bg-blue-100">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold">Готовы заказать услугу?</h3>
                <p className="text-gray-600">Заявки принимаются круглосуточно</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <a
                  href="tel:+79787013050"
                  className="inline-flex items-center gap-2 font-medium text-gray-900 transition-colors hover:text-blue-600"
                >
                  <Phone className="h-4 w-4 text-blue-600" />
                  +7 (978) 701-30-50
                </a>
                <a
                  href="tel:+79787460990"
                  className="inline-flex items-center gap-2 font-medium text-gray-900 transition-colors hover:text-blue-600"
                >
                  <Phone className="h-4 w-4 text-blue-600" />
                  +7 (978) 746-09-90
                </a>
              </div>
              {service && (
                <Button
                  asChild
                  size="lg"
                  className="gap-2 rounded-none bg-blue-600 px-8 hover:bg-blue-700 hover:scale-100 active:scale-100"
                >
                  <Link href={`/services/${service.id}/apply`}>
                    <FileCheck className="h-5 w-5" />
                    Оставить заявку в ЛК
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
