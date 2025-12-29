import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Truck, 
  Phone, 
  Clock, 
  CheckCircle, 
  DollarSign,
  FileText,
  Users,
  Award,
  Shield,
  Heart,
  AlertCircle,
  Calendar,
  MapPin,
  FileCheck
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function OtkachkaPage() {
  // Находим услугу "Откачка и вывоз сточных вод"
  const service = await prisma.service.findFirst({
    where: {
      title: {
        contains: "Откачка",
      },
      isActive: true,
    },
  });
  return (
    <div className="container py-12 px-4 max-w-5xl">
      {/* Заголовок */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Truck className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Откачка и вывоз сточных вод
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Для домов, не подключенных к центральной канализации
        </p>
      </div>

      {/* Описание услуги */}
      <Card className="mb-8 animate-fade-in animate-delay-100 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardContent className="p-8">
          <p className="text-lg text-gray-700 text-center leading-relaxed">
            Мы предоставляем услуги ассенизатора по <strong>специальным социальным тарифам</strong> для населения. 
            Работаем официально, быстро и аккуратно.
          </p>
        </CardContent>
      </Card>

      {/* Стоимость услуг */}
      <Card className="mb-8 animate-fade-in animate-delay-200 shadow-lg border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <CardTitle className="text-2xl">Стоимость услуг (Социальный тариф)</CardTitle>
              <CardDescription className="text-base mt-1">
                Цены действуют с 01.03.2025 г.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-gray-700 mb-2">
              <strong>Тариф зависит от объема цистерны и удаленности вашего объекта:</strong>
            </p>
            <p className="text-gray-600 text-sm">
              Объем вывоза за один рейс зависит от вашей заявки и доступности свободного спецтранспорта.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Точную стоимость уточняйте при оформлении заявки</span>
          </div>
        </CardContent>
      </Card>

      {/* Как заказать */}
      <Card className="mb-8 animate-fade-in animate-delay-300 shadow-lg border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Phone className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl">Как заказать услугу?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Заявки принимаются круглосуточно</h3>
                <p className="text-gray-700 mb-3">
                  Позвоните в диспетчерскую:
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  <a 
                    href="tel:+79787013050" 
                    className="inline-flex items-center gap-2 text-xl font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    +7 (978) 701-30-50
                  </a>
                  <a 
                    href="tel:+79787460990" 
                    className="inline-flex items-center gap-2 text-xl font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    +7 (978) 746-09-90
                  </a>
                </div>
                {service && (
                  <Button asChild className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <Link href={`/services/${service.id}/apply`}>
                      <FileCheck className="h-4 w-4" />
                      Оставить заявку в ЛК
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Согласуйте время</h3>
                <p className="text-gray-700">
                  Оператор уточнит детали. Обычно мы приезжаем в течение <strong>2-х дней</strong> после заявки 
                  (при наличии свободной техники).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Оплатите</h3>
                <p className="text-gray-700">
                  Оплата производится на тот же <strong>лицевой счет</strong>, по которому вы платите за воду.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Встретьте машину</h3>
                <p className="text-gray-700">
                  Вам нужно быть дома, чтобы подписать <strong>акт выполненных работ</strong>.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Что требуется от вас */}
      <Card className="mb-8 animate-fade-in animate-delay-400 shadow-lg border-l-4 border-l-orange-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-orange-600" />
            <CardTitle className="text-2xl">Что требуется от вас?</CardTitle>
          </div>
          <CardDescription className="text-base">
            Чтобы мы могли оказать услугу быстро и качественно, пожалуйста:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Обеспечьте свободный проезд техники к месту выкачки.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Предоставьте доступ к люку (для прокладки шлангов).</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Лично присутствуйте при проведении работ.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Льготы и компенсации */}
      <Card className="mb-8 animate-fade-in animate-delay-500 shadow-lg border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle className="text-2xl">Льготы и компенсации</CardTitle>
              <CardDescription className="text-base mt-1">
                Государственная поддержка для граждан в трудной жизненной ситуации
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-gray-700 mb-4">
              Согласно <strong>Постановлению Совета Министров РК №80</strong>, вы можете получить материальную помощь 
              (компенсацию расходов) на услуги вывоза стоков, если у вас заключен договор с ООО «Крымская Водная Компания».
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Кто имеет право на помощь:
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Ветераны</p>
                    <p className="text-sm text-gray-600">
                      ВОВ, участники боевых действий (статус на 21.02.2014), а также лица, которым на 02.09.1945 было менее 18 лет.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Пострадавшие от аварий</p>
                    <p className="text-sm text-gray-600">
                      Ликвидаторы ЧАЭС и приравненные категории.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Люди с инвалидностью</p>
                    <p className="text-sm text-gray-600">
                      Инвалиды всех групп и семьи, воспитывающие детей-инвалидов.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Семьи</p>
                    <p className="text-sm text-gray-600">
                      Многодетные семьи.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Пострадавшие от репрессий</p>
                    <p className="text-sm text-gray-600">
                      Реабилитированные лица.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Пенсионеры</p>
                    <p className="text-sm text-gray-600">
                      Одиноко проживающие (или живущие в семье из неработающих пенсионеров), получающие федеральную социальную доплату к пенсии.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Кнопка заказать услугу */}
      <div className="text-center mb-8 animate-fade-in animate-delay-600">
        <Card className="inline-block border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Phone className="h-12 w-12 text-blue-600" />
              <div>
                <h3 className="font-semibold text-xl mb-2">Готовы заказать услугу?</h3>
                <p className="text-gray-600 mb-4">
                  Позвоните нам прямо сейчас — заявки принимаются круглосуточно
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-md">
                <Button asChild size="lg" className="gap-2 text-lg px-8 py-6">
                  <Link href="tel:+79787013050">
                    <Phone className="h-5 w-5" />
                    +7 (978) 701-30-50
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 text-lg px-8 py-6">
                  <Link href="tel:+79787460990">
                    <Phone className="h-5 w-5" />
                    +7 (978) 746-09-90
                  </Link>
                </Button>
                {service && (
                  <Button asChild size="lg" variant="default" className="gap-2 text-lg px-8 py-6 bg-green-600 hover:bg-green-700">
                    <Link href={`/services/${service.id}/apply`}>
                      <FileCheck className="h-5 w-5" />
                      Оставить заявку в ЛК
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

