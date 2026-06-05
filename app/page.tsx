import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Wrench, FileText, CreditCard, Phone, CheckCircle, Droplet, AlertTriangle, Mail, Shield, Award, Building2 } from "lucide-react";
import { QuickActionCard } from "@/components/QuickActionCard";
import { AboutCompany } from "@/components/AboutCompany";
import { NewsSection } from "@/components/NewsSection";
import { BecomeSubscriberButton } from "@/components/BecomeSubscriberButton";
import { prisma, withRetry } from "@/lib/prisma";

export const revalidate = 120;

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
    const newsData = await withRetry(() =>
      prisma.news.findMany({
        where: { published: true },
        include: {
          author: { select: { name: true, email: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 6,
      })
    ).catch((error) => {
      console.error("Error loading news (after retry):", error);
      return [];
    }) as Array<{
      id: string;
      title: string;
      content: string;
      imageUrl: string | null;
      publishedAt: Date | null;
      author: {
        name: string | null;
        email: string;
      };
    }>;
    news = newsData.map((item) => ({
      ...item,
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
    }));
  } catch (error) {
    console.error("Error loading news:", error);
    news = [];
  }
  return (
    <div className="flex flex-col">
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col lg:min-h-[calc(100dvh-4.5rem)]">
      <section className="relative overflow-hidden py-16 text-white md:py-24">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat before:absolute before:inset-0 before:z-10 before:bg-sky-950/60"
          style={{ backgroundImage: "url(/images/banner-bg.jpg)" }}
          aria-hidden
        />
        <div className="relative z-20 w-full px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="mx-auto flex min-h-[300px] max-w-7xl flex-col items-start justify-center gap-8 lg:min-h-[280px] lg:flex-row lg:items-center">
            <div className="max-w-3xl flex-1 animate-fade-in">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px w-10 bg-white/80" />
                <span className="text-sm font-semibold uppercase tracking-wide text-white/90">
                  Официальный сайт
                </span>
              </div>
              <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                ООО &quot;Крымская Водная Компания&quot;
              </h1>
              <p className="mb-8 text-lg text-white/90 md:text-xl lg:text-2xl">
                Надежное водоснабжение и водоотведение для жителей Крыма
              </p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <BecomeSubscriberButton className="h-auto min-h-[3.25rem] rounded-none bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-none hover:bg-blue-700 hover:scale-100 active:scale-100" />
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-auto min-h-[3.25rem] rounded-none border border-white/20 bg-transparent px-6 py-4 text-base font-medium text-white hover:bg-white/10 hover:scale-100 active:scale-100"
                >
                  <Link href="/login">Личный кабинет</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col bg-slate-50 pt-10 pb-16 md:pt-12 md:pb-20 lg:pb-24">
        <div className="container mx-auto flex flex-1 flex-col justify-center px-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-8 md:mb-10 tracking-tight animate-fade-in">Быстрые действия</h2>
          <div className="quick-actions-grid grid auto-rows-fr grid-cols-1 items-stretch gap-4 pb-0 md:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              iconName="Droplet"
              title="Передать показания"
              description="Передать показания счетчиков воды"
              href="/dashboard/meters"
              iconColor="text-blue-500"
              buttonAccent="blue"
            />
            <QuickActionCard
              iconName="AlertTriangle"
              title="Сообщить об аварии"
              description="Передать сообщение об аварии"
              href="/emergency"
              publicAccess
              isEmergency
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
          </div>
        </div>
      </section>
      </div>

      <div className="pt-8">
        <NewsSection news={news} />
      </div>

      <AboutCompany />

      {/* Contact Info */}
      <section className="bg-white py-16">
        <div className="container mx-auto mb-12 px-4">
          <h2 className="text-4xl font-semibold text-center tracking-tight">Свяжитесь с нами</h2>
        </div>
        <div className="grid w-full grid-cols-1 lg:grid-cols-2 lg:items-stretch">
            {/* Прием показаний водомеров ХВС */}
            <Card className="flex min-h-[520px] flex-col rounded-none border-x-0 border-t border-b shadow-none hover:translate-y-0 lg:border-r">
              <CardContent className="flex h-full w-full flex-col items-center px-8 pb-14 pt-14 text-center lg:px-12 lg:pb-16 lg:pt-16">
                <div className="mb-10 flex min-h-[140px] w-full max-w-lg flex-col items-center justify-start gap-3 text-center lg:min-h-[150px]">
                  <Droplet className="h-8 w-8 shrink-0 text-blue-500" />
                  <CardTitle className="text-center text-2xl leading-tight">Прием показаний водомеров ХВС</CardTitle>
                  <CardDescription className="mx-auto max-w-sm text-center text-base">
                    Передача показаний счетчиков холодного водоснабжения
                  </CardDescription>
                </div>
                <div className="flex w-full max-w-lg flex-col space-y-6 text-center">
                  <div className="flex min-h-[88px] flex-col items-center justify-start space-y-1 text-center">
                    <Phone className="h-5 w-5 shrink-0 text-blue-500" />
                    <a href="tel:+79780800366" className="text-lg font-medium text-slate-900 hover:text-primary">
                      +7 (978) 080-03-66
                    </a>
                    <p className="max-w-sm text-sm text-slate-600">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</p>
                  </div>
                  <div className="flex min-h-[88px] flex-col items-center justify-start space-y-1 text-center">
                    <Phone className="h-5 w-5 shrink-0 text-blue-500" />
                    <a href="tel:+79884648724" className="text-lg font-medium text-slate-900 hover:text-primary">
                      +7 (988) 464-87-24
                    </a>
                    <p className="max-w-sm text-sm text-slate-600">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</p>
                  </div>
                  <div className="flex min-h-[132px] flex-col items-center justify-start border-t border-slate-200 pt-6 text-center">
                    <Mail className="mb-2 h-5 w-5 shrink-0 text-slate-500" />
                    <p className="mb-1 font-medium text-slate-900">Email для передачи показаний</p>
                    <a href="mailto:NVKVK2208@mail.ru" className="text-slate-600 hover:text-primary">
                      NVKVK2208@mail.ru
                    </a>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                      Отправляйте показания счетчиков на этот адрес
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Аварийно-диспетчерская служба */}
            <Card className="flex min-h-[520px] flex-col rounded-none border-x-0 border-t border-b border-red-200 bg-red-50 shadow-none hover:translate-y-0">
              <CardContent className="flex h-full w-full flex-col items-center px-8 pb-14 pt-14 text-center lg:px-12 lg:pb-16 lg:pt-16">
                <div className="mb-10 flex min-h-[140px] w-full max-w-lg flex-col items-center justify-start gap-3 text-center lg:min-h-[150px]">
                  <AlertTriangle className="h-8 w-8 shrink-0 text-red-500" />
                  <CardTitle className="text-center text-2xl leading-tight">Аварийно-диспетчерская служба</CardTitle>
                  <CardDescription className="mx-auto max-w-sm text-center text-base">
                    Круглосуточная служба для экстренных ситуаций
                  </CardDescription>
                </div>
                <div className="flex w-full max-w-lg flex-col space-y-6 text-center">
                  <div className="flex min-h-[88px] flex-col items-center justify-start space-y-1 text-center">
                    <Phone className="h-5 w-5 shrink-0 text-red-500" />
                    <a href="tel:+79787013050" className="text-lg font-medium text-slate-900 hover:text-red-600">
                      +7 (978) 701-30-50
                    </a>
                    <p className="text-sm text-slate-600">Круглосуточно</p>
                  </div>
                  <div className="flex min-h-[88px] flex-col items-center justify-start space-y-1 text-center">
                    <Phone className="h-5 w-5 shrink-0 text-red-500" />
                    <a href="tel:+79787460990" className="text-lg font-medium text-slate-900 hover:text-red-600">
                      +7 (978) 746-09-90
                    </a>
                    <p className="text-sm text-slate-600">Круглосуточно</p>
                  </div>
                  <div className="flex min-h-[132px] flex-col items-center justify-center border-t border-red-200">
                    <Button
                      asChild
                      className="rounded-none bg-red-600 px-8 py-6 text-base hover:bg-red-700 hover:scale-100 active:scale-100"
                    >
                      <Link href="/emergency">Сообщить об аварии</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}

