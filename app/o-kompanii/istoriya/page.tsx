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
  Target
} from "lucide-react";

export default function IstoriyaPage() {
  return (
    <div className="container py-12 px-4 max-w-6xl">
      {/* Заголовок */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Droplet className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          ООО «Крымская Водная Компания»: от истоков к современности
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Мы — крупнейшее водоснабжающее предприятие Сакского района и работаем в 7 районах Республики Крым. 
          Наша история — это путь от восстановления заброшенных сельских сетей до внедрения цифровых технологий управления водой.
        </p>
      </div>

      {/* Как всё начиналось */}
      <Card className="mb-8 animate-fade-in animate-delay-100 shadow-lg border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl">Как всё начиналось</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Централизованная вода в крымских селах появилась в <strong>60-х годах</strong> прошлого века силами колхозов. 
            Но к концу 90-х система пришла в упадок: техника устарела, предприятия банкротились, а жители рисковали остаться без качественной воды.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">
              <strong>Возрождение началось в 2000 году.</strong> Тогда энтузиасты во главе с В.П. Кожемякиным создали первое частное предприятие «Сервис-Плюс», 
              а чуть позже, в <strong>2003 году</strong>, появилась команда Э.С. Черкашина — «Сакский регионсервис».
            </p>
          </div>
          <p className="text-gray-700 leading-relaxed">
            В <strong>2006 году</strong> мы объединили усилия, став «Сакской водной компанией», а в <strong>2014 году</strong> трансформировались в 
            <strong> ООО «Крымская Водная Компания»</strong>. Мы взяли на себя ответственность за воду там, где другие не справлялись.
          </p>
        </CardContent>
      </Card>

      {/* Мы сегодня: масштаб и цифры */}
      <Card className="mb-8 animate-fade-in animate-delay-200 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl">Мы сегодня: масштаб и цифры</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Сегодня мы обеспечиваем водой <strong>234 населенных пункта</strong> и обслуживаем канализацию в <strong>28 поселках</strong>.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">География</h3>
              </div>
              <p className="text-sm text-gray-600">
                Сакский, Черноморский, Первомайский, Симферопольский, Нижнегорский, Раздольненский и Советский районы
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Команда</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">568</p>
              <p className="text-xs text-gray-600">квалифицированных сотрудников</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Home className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Абоненты</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">177 000+</p>
              <p className="text-xs text-gray-600">человек получают питьевую воду</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Инфраструктура</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">2 312 км</p>
              <p className="text-xs text-gray-600">водопроводных сетей</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">406</p>
              <p className="text-xs text-gray-600">артезианских скважин</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">Динамика доверия</p>
                <p className="text-amber-800 text-sm">
                  Мы видим, как растет потребность в наших услугах. Если в <strong>2017 году</strong> к нам обратилось 
                  <strong> 112 новых абонентов</strong>, то в <strong>2019 году</strong> заявок на подключение было уже 
                  <strong> более 1000</strong>.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Технологии и модернизация */}
      <Card className="mb-8 animate-fade-in animate-delay-300 shadow-lg border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-green-600" />
            <CardTitle className="text-2xl">Технологии и модернизация</CardTitle>
          </div>
          <CardDescription className="text-base">
            Наша главная цель — круглосуточная вода в каждом доме
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Умное управление
            </h3>
            <p className="text-gray-700 pl-7 leading-relaxed">
              С <strong>2018 года</strong> мы внедряем дистанционный мониторинг. Сейчас <strong>189 скважин</strong> управляются удаленно — 
              оператор видит состояние насоса на экране, а не едет в поле.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-green-600" />
              Новая техника
            </h3>
            <p className="text-gray-700 pl-7 leading-relaxed">
              За последние годы мы полностью обновили автопарк (<strong>53 новые машины</strong>) и установили 
              <strong> более 800 надежных российских насосов</strong>.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Борьба с потерями
            </h3>
            <p className="text-gray-700 pl-7 leading-relaxed">
              Аварийные бригады оснащены современным оборудованием для поиска скрытых утечек, что бережет водные ресурсы Крыма.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              Благодаря восстановлению <strong>30+ скважин</strong>, мы смогли обеспечить круглосуточную подачу воды 
              во всех обслуживаемых селах.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Реальные дела */}
      <Card className="mb-8 animate-fade-in animate-delay-400 shadow-lg border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-2xl">Реальные дела</CardTitle>
          </div>
          <CardDescription className="text-base">
            Мы не просто эксплуатируем старое, мы строим новое
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 leading-relaxed">
            За последние <strong>6 лет</strong> мы подготовили <strong>112 проектов</strong> капитального ремонта.
          </p>

          <div>
            <h3 className="font-semibold text-lg mb-3">Полная замена сетей (более 40 км):</h3>
            <div className="grid md:grid-cols-3 gap-2 pl-7">
              <span className="text-gray-700">• села Лушино</span>
              <span className="text-gray-700">• Витино</span>
              <span className="text-gray-700">• Столбовое</span>
              <span className="text-gray-700">• Красноярское</span>
              <span className="text-gray-700">• Свердлово</span>
              <span className="text-gray-700">• и другие</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Модернизация очистных сооружений (КОС):</h3>
            <div className="grid md:grid-cols-2 gap-2 pl-7">
              <span className="text-gray-700">• пгт Черноморское</span>
              <span className="text-gray-700">• Первомайское</span>
              <span className="text-gray-700">• Гвардейское</span>
              <span className="text-gray-700">• с. Орехово</span>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900 mb-1">Инвестиции</p>
                <p className="text-purple-800 text-sm">
                  Только в Гвардейском поселении за счет собственных средств мы модернизировали <strong>7 скважин</strong> и 
                  заменили <strong>5,5 км труб</strong>.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Социальная ответственность */}
      <Card className="mb-8 animate-fade-in animate-delay-500 shadow-lg border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-red-600" />
            <CardTitle className="text-2xl">Социальная ответственность</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed mb-4">
            Мы живем и работаем рядом с вами. <strong>«Крымская Водная Компания»</strong> помогает школам, детским садам и больницам. 
            В трудные моменты — будь то ураган, снегопад или подтопление — наша техника и люди всегда приходят на помощь местным жителям.
          </p>
          <div className="bg-white rounded-lg p-6 border border-red-200">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-red-600" />
              <p className="text-lg font-semibold text-gray-900">
                Наша миссия проста: качественно, гарантированно и бесперебойно подавать чистую воду в каждый дом.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


