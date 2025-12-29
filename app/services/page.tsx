import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Droplet, Wrench, FileText, Phone, Plug, Settings, MessageSquare, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";

const iconMap: { [key: string]: any } = {
  подключение: Plug,
  ремонт: Wrench,
  установка: Settings,
  консультация: Phone,
  документы: FileText,
  анализ: Droplet,
};

// Специальная обработка для услуги откачки
const getServiceIcon = (service: { title: string; category: string }) => {
  if (service.title.toLowerCase().includes("откачка") || service.title.toLowerCase().includes("сточных вод")) {
    return Truck;
  }
  return iconMap[service.category] || Plug;
};

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <div className="container py-12 px-4">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">Наши услуги</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Полный спектр услуг по водоснабжению и водоотведению для жителей Крыма
        </p>
      </div>

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

