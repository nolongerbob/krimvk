import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Droplet, Wrench, FileText, Phone, Plug, Settings, Truck } from "lucide-react";
import { prisma, withRetry } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { sitePageClass, siteContainerClass, sitePrimaryBtnClass } from "@/components/site/site-styles";
import { dashboardTileClass } from "@/components/dashboard/dashboard-styles";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const iconMap: { [key: string]: any } = {
  подключение: Plug,
  Подключение: Plug,
  ремонт: Wrench,
  Ремонт: Wrench,
  установка: Settings,
  Установка: Settings,
  консультация: Phone,
  Консультация: Phone,
  документы: FileText,
  Документы: FileText,
  анализ: Droplet,
  Анализ: Droplet,
};

// Специальная обработка для услуги откачки
const getServiceIcon = (service: { title: string; category: string }) => {
  if (service.title.toLowerCase().includes("откачка") || service.title.toLowerCase().includes("сточных вод")) {
    return Truck;
  }
  // Нормализуем категорию: приводим к нижнему регистру, но ищем в мапе с учетом регистра
  const categoryLower = service.category.toLowerCase();
  const categoryKey = Object.keys(iconMap).find(
    key => key.toLowerCase() === categoryLower
  );
  return categoryKey ? iconMap[categoryKey] : Plug;
};

const hiddenServiceTitles = new Set([
  "стать абонентом",
  "консультации специалистов",
]);

function isHiddenService(title: string) {
  return hiddenServiceTitles.has(title.toLowerCase().trim());
}

const serviceCardDescriptions: Record<string, string> = {
  "Ремонт водопроводных сетей": "Аварийный и плановый ремонт сетей.",
  "Установка счетчиков воды": "Установка и поверка счётчиков воды.",
  "Переоформление договора": "Переоформление при смене собственника.",
  "Проверка качества воды": "Лабораторный анализ качества воды.",
  "Откачка и вывоз сточных вод": "Откачка для домов без канализации.",
  "Технологическое присоединение": "Техусловия на подключение к водоснабжению.",
};

function getServiceCardDescription(title: string, description: string) {
  const shortText = serviceCardDescriptions[title.trim()];
  if (shortText) return shortText;

  const normalized = description.trim();
  const firstSentence = normalized.match(/^[^.!?]+[.!?]/)?.[0]?.trim();
  if (firstSentence && firstSentence.length <= 72) return firstSentence;

  return normalized.length > 72 ? `${normalized.slice(0, 69).trim()}…` : normalized;
}

function getServiceIconAppearance(service: { title: string; category: string }) {
  const title = service.title.toLowerCase();

  if (title.includes("откачка") || title.includes("сточных")) {
    return { boxClass: "bg-emerald-100", iconClass: "text-emerald-600" };
  }
  if (title.includes("технологическое") || title.includes("присоединение")) {
    return { boxClass: "bg-indigo-100", iconClass: "text-indigo-600" };
  }
  if (title.includes("ремонт")) {
    return { boxClass: "bg-slate-100", iconClass: "text-slate-600" };
  }
  if (title.includes("счетчик") || title.includes("счётчик")) {
    return { boxClass: "bg-purple-100", iconClass: "text-purple-600" };
  }
  if (title.includes("переоформление") || title.includes("договор")) {
    return { boxClass: "bg-orange-100", iconClass: "text-orange-600" };
  }
  if (title.includes("качества") || title.includes("анализ")) {
    return { boxClass: "bg-cyan-100", iconClass: "text-cyan-600" };
  }

  const category = service.category.toLowerCase();
  if (category === "ремонт") return { boxClass: "bg-slate-100", iconClass: "text-slate-600" };
  if (category === "установка") return { boxClass: "bg-purple-100", iconClass: "text-purple-600" };
  if (category === "документы") return { boxClass: "bg-orange-100", iconClass: "text-orange-600" };
  if (category === "анализ") return { boxClass: "bg-cyan-100", iconClass: "text-cyan-600" };
  if (category === "подключение") return { boxClass: "bg-blue-100", iconClass: "text-blue-600" };
  if (category === "консультация") return { boxClass: "bg-slate-100", iconClass: "text-slate-600" };

  return { boxClass: "bg-blue-100", iconClass: "text-blue-600" };
}

export default async function ServicesPage() {
  let services: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    price: number | null;
    isActive: boolean;
  }> = [];
  
  try {
    services = await withRetry(() =>
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      })
    ).catch((error) => {
      console.error("[ServicesPage] Ошибка при загрузке услуг:", error);
      return [];
    }) as typeof services;
    
    // Если услуг нет, пытаемся создать базовые услуги
    if (services.length === 0) {
      console.log('[ServicesPage] Услуги не найдены, создаю базовые услуги...');
      try {
        const basicServices = [
          {
            title: "Ремонт водопроводных сетей",
            description: "Аварийный и плановый ремонт водопроводных сетей, замена труб, устранение протечек.",
            category: "ремонт",
            price: null,
            isActive: true,
          },
          {
            title: "Установка счетчиков воды",
            description: "Установка и поверка счетчиков холодной и горячей воды. Официальная регистрация приборов учета.",
            category: "установка",
            price: 5000,
            isActive: true,
          },
          {
            title: "Переоформление договора",
            description: "Переоформление договора на водоснабжение при смене собственника или других обстоятельствах.",
            category: "документы",
            price: null,
            isActive: true,
          },
          {
            title: "Проверка качества воды",
            description: "Лабораторный анализ качества воды на соответствие санитарным нормам и стандартам.",
            category: "анализ",
            price: 3000,
            isActive: true,
          },
          {
            title: "Откачка и вывоз сточных вод",
            description: "Услуги ассенизатора по специальным социальным тарифам для домов, не подключенных к центральной канализации. Работаем официально, быстро и аккуратно.",
            category: "ремонт",
            price: null,
            isActive: true,
          },
        ];

        for (const serviceData of basicServices) {
          const existing = await withRetry(() =>
            prisma.service.findFirst({
              where: { title: serviceData.title },
            })
          ).catch(() => null);
          
          if (existing) {
            await withRetry(() =>
              prisma.service.update({
                where: { id: existing.id },
                data: { isActive: true },
              })
            ).catch((e) => console.error('Error updating service:', e));
          } else {
            await withRetry(() =>
              prisma.service.create({
                data: serviceData,
              })
            ).catch((e) => console.error('Error creating service:', e));
          }
        }

        // Создаем услугу "Технологическое присоединение"
        const techService = await withRetry(() =>
          prisma.service.findFirst({
            where: {
              OR: [
                { id: "tehnologicheskoe-prisoedinenie" },
                { title: { contains: "Технологическое присоединение", mode: "insensitive" } },
              ],
            },
          })
        ).catch(() => null);

        if (techService) {
          await withRetry(() =>
            prisma.service.update({
              where: { id: techService.id },
              data: { isActive: true },
            })
          ).catch((e) => console.error('Error updating tech service:', e));
        } else {
          await withRetry(() =>
            prisma.service.create({
              data: {
                id: "tehnologicheskoe-prisoedinenie",
                title: "Технологическое присоединение",
                description: "Заявка на выдачу технических условий на подключение (технологическое присоединение) к централизованным системам холодного водоснабжения и (или) водоотведения",
                category: "подключение",
                isActive: true,
              },
            })
          ).catch((e) => console.error('Error creating tech service:', e));
        }

        // Загружаем услуги снова
        services = await withRetry(() =>
          prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
          })
        );
        console.log(`[ServicesPage] Создано услуг: ${services.length}`);
      } catch (seedError) {
        console.error('[ServicesPage] Ошибка при создании услуг:', seedError);
      }
    }
    
    // Логируем для отладки
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ServicesPage] Найдено услуг: ${services.length}`);
      services.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.title} (ID: ${s.id}, активна: ${s.isActive})`);
      });
    }
  } catch (error) {
    console.error('[ServicesPage] Ошибка при загрузке услуг:', error);
    // В случае ошибки показываем пустой массив, чтобы страница не упала
    services = [];
  }

  const visibleServices = services.filter((service) => !isHiddenService(service.title));
  
  return (
    <div className={`${sitePageClass} flex min-h-[calc(100dvh-4rem)] flex-col lg:min-h-[calc(100dvh-4.5rem)]`}>
      <div className="container mx-auto flex flex-1 flex-col justify-center px-4 py-8 md:py-10">
        <div className="mb-6 shrink-0 text-center md:mb-8 animate-fade-in">
          <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">Наши услуги</h1>
          <p className="mx-auto max-w-2xl text-base text-slate-600 md:text-lg">
            Полный спектр услуг по водоснабжению и водоотведению для жителей Крыма
          </p>
        </div>

        {visibleServices.length === 0 ? (
          <DashboardCard className="rounded-none shadow-none">
            <DashboardCardBody className="py-12 text-center">
              <p className="text-slate-500 mb-4">Услуги временно недоступны. Пожалуйста, попробуйте позже.</p>
              <Button asChild className={sitePrimaryBtnClass}>
                <Link href="/">Вернуться на главную</Link>
              </Button>
            </DashboardCardBody>
          </DashboardCard>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {visibleServices.map((service) => {
              const Icon = getServiceIcon(service);
              const appearance = getServiceIconAppearance(service);
              const isTechConnection = service.id === "tehnologicheskoe-prisoedinenie" ||
                service.title.toLowerCase().includes("технологическое присоединение");
              const serviceLink = isTechConnection ? "/stat-abonentom" : `/services/${service.id}/apply`;
              const cardDescription = getServiceCardDescription(service.title, service.description);

              return (
                <DashboardCard
                  key={service.id}
                  className={cn(dashboardTileClass, "flex h-full flex-col justify-between")}
                >
                  <div className="p-7 pb-0 p-6 pb-4" >
                    <div
                      className={cn(
                        "mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-none",
                        appearance.boxClass
                      )}
                    >
                      <Icon className={cn("h-6 w-6", appearance.iconClass)} />
                    </div>
                    <h2 className="mb-2 min-h-[3.25rem] text-xl font-semibold leading-snug text-slate-900 line-clamp-2">
                      {service.title}
                    </h2>
                    <p className="min-h-[2.75rem] text-base leading-snug line-clamp-2">
                      {cardDescription}
                    </p>
                  </div>
                  <DashboardCardBody className="p-7 pt-5">
                    <Button asChild className={`h-11 w-full text-base ${sitePrimaryBtnClass}`}>
                      <Link href={serviceLink}>Подать заявку</Link>
                    </Button>
                  </DashboardCardBody>
                </DashboardCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

