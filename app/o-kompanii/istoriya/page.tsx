import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Droplet,
  MapPin,
  Users,
  Home,
  Wrench,
  TrendingUp,
  Clock,
  Award,
  Heart,
  Zap,
  Building2,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sectionCardClass =
  "mb-8 rounded-none border border-gray-200 border-l-4 border-l-blue-600 shadow-none";

const historyTimeline = [
  {
    year: "60-е",
    title: "Первые сети",
    description:
      "Централизованная вода в крымских селах появилась силами колхозов — начало формирования водохозяйственной инфраструктуры региона.",
  },
  {
    year: "90-е",
    title: "Упадок системы",
    description:
      "К концу 90-х система пришла в упадок: техника устарела, предприятия банкротились, а жители рисковали остаться без качественной воды.",
  },
  {
    year: "2000",
    title: "Возрождение",
    description:
      "Энтузиасты создали первое частное предприятие «Сервис-Плюс» — начало нового этапа восстановления водоснабжения.",
  },
  {
    year: "2003",
    title: "Новая команда",
    description: "Появилась команда «Сакский регионсервис», которая продолжила развитие отрасли в районе.",
  },
  {
    year: "2006",
    title: "Объединение",
    description:
      "Усилия объединились — создана «Сакская водная компания», взявшая на себя эксплуатацию сетей.",
  },
  {
    year: "2014",
    title: "Крымская Водная Компания",
    description:
      "Трансформация в ООО «Крымская Водная Компания». Мы взяли на себя ответственность за воду там, где другие не справлялись.",
    highlight: true,
  },
] as const;

const mainStats = [
  {
    value: "234",
    label: "населённых пункта",
    description: "обеспечиваем водой",
  },
  {
    value: "28",
    label: "посёлков",
    description: "на обслуживании канализации",
  },
] as const;

function StatCounter({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-none border border-gray-200 bg-white p-6 text-center">
      <p className="text-4xl font-bold tabular-nums text-blue-600 md:text-5xl">{value}</p>
      <p className="mt-2 text-base font-semibold text-gray-900">{label}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function TimelineItem({
  year,
  title,
  description,
  highlight = false,
  isLast = false,
}: {
  year: string;
  title: string;
  description: string;
  highlight?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4 md:gap-6">
      {!isLast && (
        <div
          className="absolute left-[15px] top-8 hidden h-[calc(100%+1.5rem)] w-px bg-gray-200 md:block"
          aria-hidden
        />
      )}
      <div className="relative z-10 shrink-0">
        <p
          className={cn(
            "flex h-8 min-w-[4.5rem] items-center justify-center rounded-none px-2 text-sm font-bold md:min-w-[5rem] md:text-base",
            highlight ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
          )}
        >
          {year}
        </p>
      </div>
      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-8")}>
        <div className="rounded-none border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-700 md:text-base">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function IstoriyaPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-gray-50 py-8 md:py-12 pb-14 lg:min-h-[calc(100dvh-4.5rem)]">
      <div className="container max-w-6xl flex-1 px-4">
        <div className="mb-10 text-center animate-fade-in md:mb-12">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-none bg-cyan-100">
            <Droplet className="h-7 w-7 text-cyan-600" />
          </div>
          <h1 className="mx-auto mb-3 max-w-4xl text-center text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            ООО «Крымская Водная Компания»: от истоков к современности
          </h1>
          <p className="mx-auto max-w-3xl text-center text-base text-gray-600 md:text-lg">
            Мы — крупнейшее водоснабжающее предприятие Сакского района и работаем в 7 районах
            Республики Крым. Наша история — путь от восстановления заброшенных сельских сетей до
            внедрения цифровых технологий управления водой.
          </p>
        </div>

        <Card className={cn(sectionCardClass, "animate-fade-in animate-delay-100")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold md:text-2xl">Как всё начиналось</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {historyTimeline.map((item, index) => (
                <TimelineItem
                  key={item.year}
                  {...item}
                  isLast={index === historyTimeline.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            sectionCardClass,
            "animate-fade-in animate-delay-200"
          )}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold md:text-2xl">
                Мы сегодня: масштаб и цифры
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {mainStats.map((stat) => (
                <StatCounter key={stat.value} {...stat} />
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-none border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">География</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Сакский, Черноморский, Первомайский, Симферопольский, Нижнегорский, Раздольненский
                  и Советский районы
                </p>
              </div>

              <div className="rounded-none border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Команда</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">568</p>
                <p className="text-xs text-gray-600">квалифицированных сотрудников</p>
              </div>

              <div className="rounded-none border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-3">
                  <Home className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Абоненты</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">177 000+</p>
                <p className="text-xs text-gray-600">человек получают питьевую воду</p>
              </div>

              <div className="rounded-none border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Инфраструктура</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">2 312 км</p>
                <p className="text-xs text-gray-600">водопроводных сетей</p>
                <p className="mt-2 text-2xl font-bold text-blue-600">406</p>
                <p className="text-xs text-gray-600">артезианских скважин</p>
              </div>
            </div>

            <div className="rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="mb-1 font-semibold text-amber-900">Динамика доверия</p>
                  <p className="text-sm text-amber-800">
                    Если в <strong>2017 году</strong> к нам обратилось <strong>112 новых абонентов</strong>,
                    то в <strong>2019 году</strong> заявок на подключение было уже{" "}
                    <strong>более 1000</strong>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(sectionCardClass, "animate-fade-in animate-delay-300")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold md:text-2xl">
                  Технологии и модернизация
                </CardTitle>
                <CardDescription className="mt-1 text-base">
                  Наша главная цель — круглосуточная вода в каждом доме
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-lg">
                <Zap className="h-5 w-5 text-blue-600" />
                Умное управление
              </h3>
              <p className="pl-7 leading-relaxed text-gray-700">
                С <strong>2018 года</strong> мы внедряем дистанционный мониторинг. Сейчас{" "}
                <strong>189 скважин</strong> управляются удалённо — оператор видит состояние насоса
                на экране, а не едет в поле.
              </p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-lg">
                <Wrench className="h-5 w-5 text-blue-600" />
                Новая техника
              </h3>
              <p className="pl-7 leading-relaxed text-gray-700">
                За последние годы мы полностью обновили автопарк (<strong>53 новые машины</strong>) и
                установили <strong>более 800 надёжных российских насосов</strong>.
              </p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-lg">
                <Target className="h-5 w-5 text-blue-600" />
                Борьба с потерями
              </h3>
              <p className="pl-7 leading-relaxed text-gray-700">
                Аварийные бригады оснащены современным оборудованием для поиска скрытых утечек, что
                бережёт водные ресурсы Крыма.
              </p>
            </div>

            <div className="rounded-none border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-900">
                Благодаря восстановлению <strong>30+ скважин</strong>, мы смогли обеспечить
                круглосуточную подачу воды во всех обслуживаемых сёлах.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(sectionCardClass, "animate-fade-in animate-delay-400")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold md:text-2xl">Реальные дела</CardTitle>
                <CardDescription className="mt-1 text-base">
                  Мы не просто эксплуатируем старое, мы строим новое
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="leading-relaxed text-gray-700">
              За последние <strong>6 лет</strong> мы подготовили <strong>112 проектов</strong>{" "}
              капитального ремонта.
            </p>

            <div>
              <h3 className="mb-3 font-semibold text-lg">Полная замена сетей (более 40 км):</h3>
              <div className="grid gap-2 pl-4 md:grid-cols-3 md:pl-0">
                {["села Лушино", "Витино", "Столбовое", "Красноярское", "Свердлово", "и другие"].map(
                  (item) => (
                    <span key={item} className="text-gray-700">
                      • {item}
                    </span>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-lg">Модернизация очистных сооружений (КОС):</h3>
              <div className="grid gap-2 pl-4 md:grid-cols-2 md:pl-0">
                {["пгт Черноморское", "Первомайское", "Гвардейское", "с. Орехово"].map((item) => (
                  <span key={item} className="text-gray-700">
                    • {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-none border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="mb-1 font-semibold text-gray-900">Инвестиции</p>
                  <p className="text-sm text-gray-700">
                    Только в Гвардейском поселении за счёт собственных средств мы модернизировали{" "}
                    <strong>7 скважин</strong> и заменили <strong>5,5 км труб</strong>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(sectionCardClass, "animate-fade-in animate-delay-500")}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-blue-100">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold md:text-2xl">
                Социальная ответственность
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-gray-700">
              Мы живём и работаем рядом с вами. <strong>«Крымская Водная Компания»</strong> помогает
              школам, детским садам и больницам. В трудные моменты — будь то ураган, снегопад или
              подтопление — наша техника и люди всегда приходят на помощь местным жителям.
            </p>
            <div className="rounded-none border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
                <p className="text-base font-semibold leading-snug text-gray-900 md:text-lg">
                  Наша миссия проста: качественно, гарантированно и бесперебойно подавать чистую
                  воду в каждый дом.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
