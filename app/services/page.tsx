import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Droplet, Wrench, FileText, Phone, Plug, Settings, MessageSquare, Truck } from "lucide-react";
import { prisma, withRetry } from "@/lib/prisma";

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

export default async function ServicesPage() {
  let services = [];
  
  try {
    services = await withRetry(() =>
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      })
    );
    
    // Если услуг нет, пытаемся создать базовые услуги
    if (services.length === 0) {
      console.log('[ServicesPage] Услуги не найдены, создаю базовые услуги...');
      try {
        const basicServices = [
          {
            title: "Стать абонентом",
            description: "Техническое подключение к системе централизованного водоснабжения. Включает проектирование, монтаж и пусконаладочные работы.",
            category: "подключение",
            price: 15000,
            isActive: true,
          },
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
            title: "Консультации специалистов",
            description: "Консультации по вопросам водоснабжения, водоотведения, тарифам и правилам пользования.",
            category: "консультация",
            price: null,
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
          const existing = await prisma.service.findFirst({
            where: { title: serviceData.title },
          });
          
          if (existing) {
            await prisma.service.update({
              where: { id: existing.id },
              data: { isActive: true },
            });
          } else {
            await prisma.service.create({
              data: serviceData,
            });
          }
        }

        // Создаем услугу "Технологическое присоединение"
        const techService = await prisma.service.findFirst({
          where: {
            OR: [
              { id: "tehnologicheskoe-prisoedinenie" },
              { title: { contains: "Технологическое присоединение", mode: "insensitive" } },
            ],
          },
        });

        if (techService) {
          await prisma.service.update({
            where: { id: techService.id },
            data: { isActive: true },
          });
        } else {
          await prisma.service.create({
            data: {
              id: "tehnologicheskoe-prisoedinenie",
              title: "Технологическое присоединение",
              description: "Заявка на выдачу технических условий на подключение (технологическое присоединение) к централизованным системам холодного водоснабжения и (или) водоотведения",
              category: "подключение",
              isActive: true,
            },
          });
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
  
  return (
    <div className="container py-12 px-4">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">Наши услуги</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Полный спектр услуг по водоснабжению и водоотведению для жителей Крыма
        </p>
      </div>

      {services.length === 0 ? (
        <Card className="mb-12">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Услуги временно недоступны. Пожалуйста, попробуйте позже.</p>
            <Button asChild>
              <Link href="/">Вернуться на главную</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service) => {
            const Icon = getServiceIcon(service);
            return (
              <Card key={service.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className="h-8 w-8 text-blue-500" />
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <Button asChild className="w-full">
                    <Link href={`/services/${service.id}/apply`}>Подать заявку</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 md:p-12 text-center shadow-soft">
        <h2 className="text-3xl font-semibold mb-4 tracking-tight">Нужна консультация?</h2>
        <p className="text-gray-600 mb-8 text-lg">
          Наши специалисты готовы ответить на все ваши вопросы
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base rounded-xl">
            <Link href="/contact" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Позвонить
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-base rounded-xl">
            <Link href="/dashboard/questions" className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Написать в чате
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

