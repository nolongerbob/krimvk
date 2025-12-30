import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, FileText, CreditCard, Phone, CheckCircle, Droplet, AlertTriangle, Mail } from "lucide-react";
import { QuickActionCard } from "@/components/QuickActionCard";
import { AboutCompany } from "@/components/AboutCompany";
import { NewsSection } from "@/components/NewsSection";
import { BecomeSubscriberButton } from "@/components/BecomeSubscriberButton";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  // Загружаем последние опубликованные новости
  let news: Array<{
    id: string;
    title: string;
    content: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    author: {
      name: string | null;
      email: string;
    };
  }> = [];

  try {
    // Используем type assertion для обхода проблемы с типами Prisma
    const newsData = await (prisma as any).news.findMany({
      where: { published: true },
      include: {
        author: { select: { name: true, email: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });
    news = newsData;
  } catch (error) {
    console.error("Error loading news:", error);
  }
  return (
    <div className="flex flex-col px-2 sm:px-4 md:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative text-gray-900 py-16 md:py-24 overflow-hidden rounded-t-2xl rounded-b-2xl mt-2">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/banner-bg.jpg"
            alt=""
            fill
            className="object-cover"
            priority
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200/70 via-blue-100/60 to-cyan-100/70 z-10"></div>
        </div>
        <div className="relative z-20 w-full px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[300px] lg:min-h-[280px]">
            <div className="flex-1 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                ООО &quot;Крымская Водная Компания&quot;
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-700">
                Надежное водоснабжение и водоотведение для жителей Крыма
              </p>
            </div>
            <div className="flex flex-col gap-4 animate-fade-in animate-delay-200">
              <Button asChild size="lg" variant="outline" className="bg-white border-blue-300 text-blue-600 hover:bg-blue-50 text-lg px-8 py-10">
                <Link href="/login">Личный кабинет</Link>
              </Button>
              <BecomeSubscriberButton className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-20 py-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="pt-8 pb-12 bg-gray-100 rounded-t-2xl rounded-b-2xl mt-4">
        <div className="px-2 sm:px-4 md:px-6 lg:px-8">
          <h2 className="text-4xl font-semibold text-center mb-8 tracking-tight animate-fade-in">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pb-0">
            <QuickActionCard
              iconName="Droplet"
              title="Передать показания"
              description="Передать показания счетчиков воды"
              href="/dashboard/meters"
              iconColor="text-blue-500"
            />
            <QuickActionCard
              iconName="CreditCard"
              title="Оплатить счет"
              description="Оплатить счета за водоснабжение"
              href="/dashboard/bills"
              iconColor="text-green-500"
            />
            <QuickActionCard
              iconName="FileText"
              title="Мои заявки"
              description="Просмотр статуса заявок"
              href="/dashboard/applications"
              iconColor="text-purple-500"
            />
            <QuickActionCard
              iconName="Wrench"
              title="Заказать услугу"
              description="Подать заявку на услуги"
              href="/services"
              iconColor="text-orange-500"
            />
            <QuickActionCard
              iconName="AlertTriangle"
              title="Сообщение об аварии"
              description="Сообщить об аварийной ситуации"
              href="/emergency"
              iconColor="text-red-500"
              publicAccess={true}
            />
          </div>
        </div>
      </section>

      {/* About Company */}
      <AboutCompany />

      {/* News Section */}
      <div className="pt-8">
        <NewsSection news={news} />
      </div>

      {/* Contact Info */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-semibold text-center mb-12 tracking-tight">Свяжитесь с нами</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Прием показаний водомеров ХВС */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Droplet className="h-6 w-6 text-blue-500" />
                  <CardTitle>Прием показаний водомеров ХВС</CardTitle>
                </div>
                <CardDescription>
                  Передача показаний счетчиков холодного водоснабжения
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-500" />
                  <div>
                    <a href="tel:+79780800366" className="text-lg font-medium text-gray-900 hover:text-primary">
                      +7 (978) 080-03-66
                    </a>
                    <p className="text-sm text-gray-600">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-500" />
                  <div>
                    <a href="tel:+79787415759" className="text-lg font-medium text-gray-900 hover:text-primary">
                      +7 (978) 741-57-59
                    </a>
                    <p className="text-sm text-gray-600">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</p>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium mb-1">Email для передачи показаний</p>
                      <a href="mailto:pokazaniya@krimvk.ru" className="text-gray-600 hover:text-primary">
                        pokazaniya@krimvk.ru
                      </a>
                      <p className="text-sm text-gray-500 mt-1">
                        Отправляйте показания счетчиков на этот адрес
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Аварийно-диспетчерская служба */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <CardTitle>Аварийно-диспетчерская служба</CardTitle>
                </div>
                <CardDescription>
                  Круглосуточная служба для экстренных ситуаций
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-red-500" />
                  <div>
                    <a href="tel:+79787013050" className="text-lg font-medium text-gray-900 hover:text-red-600">
                      +7 (978) 701-30-50
                    </a>
                    <p className="text-sm text-gray-600">Круглосуточно</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-red-500" />
                  <div>
                    <a href="tel:+79787460990" className="text-lg font-medium text-gray-900 hover:text-red-600">
                      +7 (978) 746-09-90
                    </a>
                    <p className="text-sm text-gray-600">Круглосуточно</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

