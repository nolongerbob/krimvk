import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  Download, 
  CheckCircle, 
  MapPin, 
  Phone, 
  Calendar,
  AlertCircle,
  Lightbulb,
  Wrench,
  Building,
  FileCheck,
  User,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";

export default function PodklyucheniePage() {
  return (
    <div className="container py-12 px-4 max-w-5xl">
      {/* Заголовок */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Подключение к водоснабжению и водоотведению
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Пошаговая инструкция по подключению вашего объекта к центральным системам водоснабжения и канализации
        </p>
      </div>

      {/* Этап 1 */}
      <DashboardCard className="mb-8 animate-fade-in animate-delay-100 shadow-lg border-l-4 border-l-blue-500">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-none flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl mb-2">ЭТАП 1. Получение Технических Условий (ТУ)</h2>
              <p className="text-base">
                Первый шаг — узнать техническую возможность подключения вашего объекта
              </p>
            </div>
          </div>
        </div>
        <DashboardCardBody className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Что нужно сделать:
            </h3>
            <p className="text-slate-700 pl-7">Подать заявление в производственно-технический отдел (ПТО).</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Необходимые документы (копии):
            </h3>
            <ul className="space-y-2 pl-7">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">📄</span>
                <span>Заявление установленного образца.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">📄</span>
                <span>Учредительные документы (для юрлиц) или паспорт (для физлиц).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">📄</span>
                <span>Правоустанавливающие документы на земельный участок.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">📄</span>
                <span>Ситуационный план и границы участка.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">📄</span>
                <span>Расчет планируемой нагрузки (водопотребления).</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Совет:</p>
                <p className="text-blue-800 text-sm">
                  Рекомендуем заказать водохозяйственный расчет в проектной организации заранее, чтобы избежать корректировок в будущем.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Срок выдачи ТУ:</span>
              <span>14 рабочих дней</span>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/documents/zayavlenie-o-vydache-tehnicheskih-uslovij.docx">
                <Download className="h-4 w-4" />
                Скачать бланк заявления на выдачу ТУ
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Link href="/stat-abonentom">
                <User className="h-4 w-4" />
                Стать абонентом
              </Link>
            </Button>
          </div>
        </DashboardCardBody>
      </DashboardCard>

      {/* Этап 2 */}
      <DashboardCard className="mb-8 animate-fade-in animate-delay-200 shadow-lg border-l-4 border-l-green-500">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-none flex items-center justify-center">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl mb-2">ЭТАП 2. Заключение договора о подключении</h2>
              <p className="text-base">
                У вас есть 1 год с момента получения ТУ, чтобы заключить этот договор
              </p>
            </div>
          </div>
        </div>
        <DashboardCardBody className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Что нужно сделать:
            </h3>
            <p className="text-slate-700 pl-7">Подать заявление на заключение договора о технологическом присоединении.</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              Необходимые документы:
            </h3>
            <ul className="space-y-2 pl-7">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">📄</span>
                <span>Топографическая карта участка (масштаб 1:500), согласованная с эксплуатирующими организациями.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">📄</span>
                <span>Ситуационный план расположения объекта.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">📄</span>
                <span>Баланс водопотребления и водоотведения (с указанием целей использования: пожаротушение, бытовые нужды и т.д.).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">📄</span>
                <span>Сведения о составе сточных вод и свойствах объекта (этажность, назначение).</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-none p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">Важно:</p>
                <p className="text-amber-800 text-sm">
                  При некомплектности документов отказ выдается в течение 10 рабочих дней.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/documents/zayavlenie-na-zaklyuchenie-dogovora.docx">
                <Download className="h-4 w-4" />
                Скачать бланк заявления на договор подключения
              </Link>
            </Button>
          </div>
        </DashboardCardBody>
      </DashboardCard>

      {/* Этап 3 */}
      <DashboardCard className="mb-8 animate-fade-in animate-delay-300 shadow-lg border-l-4 border-l-purple-500">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-none flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-600">3</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl mb-2">ЭТАП 3. Проектирование</h2>
              <p className="text-base">
                Разработка технического решения для прокладки труб
              </p>
            </div>
          </div>
        </div>
        <DashboardCardBody className="space-y-4">
          <p className="text-slate-700">
            Вам необходимо обратиться в проектную организацию для разработки проектно-сметной документации на строительство сетей согласно выданным ТУ.
          </p>
          <p className="text-slate-700">
            Проект обязательно согласовывается с ООО «Крымская Водная Компания».
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-none p-4">
            <p className="text-purple-800 font-medium">
              Вы можете подать заявление на изготовление проекта непосредственно нам.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/documents/zayavlenie-na-proekt.doc">
              <Download className="h-4 w-4" />
              Скачать заявление на изготовление проекта
            </Link>
          </Button>
        </DashboardCardBody>
      </DashboardCard>

      {/* Этап 4 */}
      <DashboardCard className="mb-8 animate-fade-in animate-delay-400 shadow-lg border-l-4 border-l-orange-500">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-none flex items-center justify-center">
              <span className="text-2xl font-bold text-orange-600">4</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl mb-2">ЭТАП 4. Строительство сетей</h2>
              <p className="text-base">
                Физическое выполнение работ
              </p>
            </div>
          </div>
        </div>
        <DashboardCardBody className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
              <p className="text-slate-700">
                Вы (или подрядчик) прокладываете трубы водопровода/канализации от объекта до точки подключения согласно согласованному проекту.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
              <p className="text-slate-700">
                Уведомляете нас о готовности. Наш представитель проверяет правильность работ и подписывает акт готовности сетей.
              </p>
            </div>
          </div>
        </DashboardCardBody>
      </DashboardCard>

      {/* Этап 5 */}
      <DashboardCard className="mb-8 animate-fade-in animate-delay-500 shadow-lg border-l-4 border-l-red-500">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-none flex items-center justify-center">
              <span className="text-2xl font-bold text-red-600">5</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl mb-2">ЭТАП 5. Врезка и пуск</h2>
              <p className="text-base">
                Финальная техническая часть
              </p>
            </div>
          </div>
        </div>
        <DashboardCardBody className="space-y-4">
          <p className="text-slate-700 font-medium mb-3">
            Для получения разрешения на врезку (присоединение) предоставьте:
          </p>
          <ul className="space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-1">📂</span>
              <span>Исполнительно-техническую документацию на проложенные сети.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 mt-1">🗺️</span>
              <span>Топографическую съемку (М 1:500).</span>
            </li>
          </ul>
          <p className="text-slate-700 mt-4">
            После проверки мы выдаем разрешение, производится врезка, и стороны подписывают <strong>Акт о присоединении к сетям</strong>.
          </p>
        </DashboardCardBody>
      </DashboardCard>

      {/* Этап 6 */}
      <DashboardCard className="mb-8 animate-fade-in animate-delay-600 shadow-lg border-l-4 border-l-cyan-500">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-none flex items-center justify-center">
              <span className="text-2xl font-bold text-cyan-600">6</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl mb-2">ЭТАП 6. Заключение абонентского договора</h2>
              <p className="text-base">
                Теперь вы можете пользоваться водой легально
              </p>
            </div>
          </div>
        </div>
        <DashboardCardBody>
          <p className="text-slate-700">
            Обратитесь в абонентский отдел для заключения договора на отпуск питьевой воды и/или сброс стоков.
          </p>
        </DashboardCardBody>
      </DashboardCard>

      {/* Контакты */}
      <DashboardCard className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-xl animate-fade-in animate-delay-700">
        <div className="p-6 pb-4">
          <h2 className="text-2xl flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            Контакты и время работы
          </h2>
        </div>
        <DashboardCardBody className="space-y-6">
          <div>
            <p className="text-slate-700 mb-2 font-medium">
              <MapPin className="h-4 w-4 inline mr-2 text-blue-600" />
              Адрес:
            </p>
            <p className="text-slate-600 pl-6">
              Республика Крым, Сакский район, с. Лесновка, ул. Механизаторов, 9
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-none p-5 shadow-sm">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Отдел ПТО
              </h3>
              <p className="text-sm text-slate-600 mb-3">Технические условия, Проекты</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Тел:</span>
                  <a href="tel:98180" className="text-blue-600 hover:underline">98-180</a>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    <span className="font-medium">Пн-Чт:</span> 08:00 – 16:00
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    <span className="font-medium">Пт:</span> 08:00 – 15:00
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Обед: 12:00 – 13:00</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Сб, Вс — выходной</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-none p-5 shadow-sm">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Абонентский отдел
              </h3>
              <p className="text-sm text-slate-600 mb-3">Договоры на воду</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    <span className="font-medium">Пн-Чт:</span> 08:15 – 15:00
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Обед: 12:00 – 13:00</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Обратите внимание:</strong> Первая неделя месяца — неприемные дни
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardCardBody>
      </DashboardCard>

      {/* Кнопки скачивания и онлайн заявления */}
      <div className="grid md:grid-cols-2 gap-6 mt-12 mb-8 animate-fade-in animate-delay-800">
        <DashboardCard className="border-2 border-dashed border-slate-300 bg-slate-50">
          <DashboardCardBody className="p-6">
            <div className="flex flex-col items-center gap-4">
              <FileText className="h-12 w-12 text-slate-600" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Полный регламент подключения</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Скачайте оригинальный документ с полной информацией о процедуре подключения
                </p>
              </div>
              <Button asChild size="lg" className="gap-2">
                <Link href="/documents/poryadok-podklyucheniya-k-setyam-vodosnabzheniya-i-vodootvedeniya.pdf">
                  <Download className="h-5 w-5" />
                  Скачать оригинальный PDF
                </Link>
              </Button>
            </div>
          </DashboardCardBody>
        </DashboardCard>

        <DashboardCard className="border-2 border-dashed border-blue-300 bg-blue-50">
          <DashboardCardBody className="p-6">
            <div className="flex flex-col items-center gap-4">
              <User className="h-12 w-12 text-blue-600" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Заполнить заявление онлайн</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Подайте заявление на подключение через удобную онлайн-форму
                </p>
              </div>
              <Button asChild size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Link href="/stat-abonentom">
                  <ArrowRight className="h-5 w-5" />
                  Заполнить заявление онлайн
                </Link>
              </Button>
            </div>
          </DashboardCardBody>
        </DashboardCard>
      </div>
    </div>
  );
}

