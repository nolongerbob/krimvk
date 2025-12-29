"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, Users, Award, TrendingUp, ChevronLeft, ChevronRight, Droplet, Wrench, Rocket, UserCog, Shield, BookOpen, Construction, Cpu, Waves, Globe, Zap, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

const companyInfo: Array<{
  id: string;
  title: string;
  icon: typeof Building2;
  content: string | ReactNode;
}> = [
  {
    id: "about",
    title: "О компании",
    icon: Building2,
    content: (
      <div className="space-y-4">
        <div>
          <p className="text-xl font-semibold mb-3">ООО «Крымская Водная Компания»</p>
          <p className="mb-4">Крупнейший оператор водоснабжения в сельских районах Крыма.</p>
          <p className="mb-4">Мы работаем с 2014 года (на базе предприятий, созданных в 2000-х), чтобы обеспечить стабильной водой 7 районов республики, включая Сакский, Черноморский и Симферопольский.</p>
        </div>
        <div className="space-y-3 pt-4 border-t">
          <p className="font-semibold text-lg mb-3">Коротко о нас:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg mt-1">
                <Droplet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Масштаб:</p>
                <p className="text-gray-600">Обслуживаем 234 населенных пункта (более 177 000 жителей).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg mt-1">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Инфраструктура:</p>
                <p className="text-gray-600">2 300 км сетей, 406 скважин и современные очистные сооружения.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg mt-1">
                <Rocket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Технологии:</p>
                <p className="text-gray-600">Внедрили дистанционное управление скважинами (IoT) и обновили автопарк на 100%.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-gray-700 italic">Наша задача проста: круглосуточная подача чистой воды и оперативная помощь в любых ситуациях.</p>
        </div>
      </div>
    ),
  },
  {
    id: "team",
    title: "Наша команда",
    icon: Users,
    content: (
      <div className="space-y-4">
        <div>
          <p className="text-xl font-semibold mb-3">Команда «Крымской Водной Компании»</p>
          <p className="mb-4">Главная движущая сила и гордость нашего предприятия.</p>
          <p className="mb-4">В нашем штате 568 сотрудников, которые объединяют многолетний опыт ветеранов отрасли и энергию молодых специалистов для обслуживания сетей в 7 районах республики.</p>
        </div>
        <div className="space-y-3 pt-4 border-t">
          <p className="font-semibold text-lg mb-3">Наши принципы:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg mt-1">
                <UserCog className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Профессионализм:</p>
                <p className="text-gray-600">Высококвалифицированные инженеры и мастера, знающие каждый метр крымских коммуникаций.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg mt-1">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Надежность:</p>
                <p className="text-gray-600">Аварийные бригады работают в режиме 24/7, выезжая на устранение неполадок в любую погоду.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg mt-1">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Развитие:</p>
                <p className="text-gray-600">Мы постоянно учимся, осваивая современное насосное оборудование и цифровые системы управления.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-gray-700 italic">Мы ценим наш коллектив, который ежедневно трудится ради комфорта и уюта в домах 177 000 жителей.</p>
        </div>
      </div>
    ),
  },
  {
    id: "achievements",
    title: "Достижения",
    icon: Award,
    content: (
      <div className="space-y-4">
        <div>
          <p className="text-xl font-semibold mb-3">Реальные результаты</p>
          <p className="mb-4">Мы не просто эксплуатируем сети, мы их обновляем.</p>
          <p className="mb-4">За последние годы компания совершила качественный рывок, перейдя от латания дыр к планомерному развитию инфраструктуры Крыма.</p>
        </div>
        <div className="space-y-3 pt-4 border-t">
          <p className="font-semibold text-lg mb-3">Чего мы добились:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg mt-1">
                <Construction className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Модернизация:</p>
                <p className="text-gray-600">Заменили более 40 км ветхих сетей и реализовали 112 проектов капитального ремонта в селах.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg mt-1">
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Инновации:</p>
                <p className="text-gray-600">Внедрили автоматику и дистанционный мониторинг на 189 скважинах, а также обновили насосное оборудование на энергоэффективное.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg mt-1">
                <Waves className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="font-medium">Стабильность:</p>
                <p className="text-gray-600">Восстановили 30 заброшенных скважин, что позволило перевести водоснабжение населенных пунктов на круглосуточный режим.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-gray-700 italic">Лучшая оценка нашей работы — это доверие жителей и стабильная вода в кранах тысяч домов.</p>
        </div>
      </div>
    ),
  },
  {
    id: "development",
    title: "Развитие",
    icon: TrendingUp,
    content: (
      <div className="space-y-4">
        <div>
          <p className="text-xl font-semibold mb-3">Курс на развитие</p>
          <p className="mb-4">Мы инвестируем в завтрашний день уже сегодня.</p>
          <p className="mb-4">Наша стратегия — не просто поддерживать текущую работу, а создавать новую, технологичную систему водоснабжения.</p>
        </div>
        <div className="space-y-3 pt-4 border-t">
          <p className="font-semibold text-lg mb-3">Приоритеты на ближайшие годы:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg mt-1">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Масштабирование:</p>
                <p className="text-gray-600">Расширение сети водоснабжения для подключения новых абонентов в отдаленных поселках.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg mt-1">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Энергоэффективность:</p>
                <p className="text-gray-600">Снижение затрат и углеродного следа за счет установки умного оборудования.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg mt-1">
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">Экология:</p>
                <p className="text-gray-600">Внедрение «зеленых» стандартов и улучшение качества очистки сточных вод.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t">
          <p className="text-gray-700 italic">Мы строим будущее, где чистая вода доступна каждому, с бережным отношением к уникальной природе Крыма.</p>
        </div>
      </div>
    ),
  },
];

const galleryImages = [
  "/images/gallery/1.jpg",
  "/images/gallery/2.jpg",
  "/images/gallery/3.jpg",
  "/images/gallery/4.jpg",
  "/images/gallery/5.jpg",
  "/images/gallery/6.jpg",
];

export function AboutCompany() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const activeInfo = companyInfo[activeTab];
  const Icon = activeInfo.icon;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-semibold text-center mb-12 tracking-tight">О компании</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Левая часть - листающаяся информация */}
          <div className="space-y-4 flex flex-col h-full">
            {/* Табы */}
            <div className="flex flex-wrap gap-2 mb-6">
              {companyInfo.map((info, index) => {
                const TabIcon = info.icon;
                return (
                  <button
                    key={info.id}
                    onClick={() => setActiveTab(index)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === index
                        ? "bg-blue-600 text-white shadow-soft-lg scale-[1.02]"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-[1.02]"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{info.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Контент активного таба */}
            <Card className="flex-1 flex flex-col h-[550px]">
              <CardContent className="p-6 flex-1 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold">{activeInfo.title}</h3>
                </div>
                <div className="text-gray-700 leading-relaxed text-base flex-1 overflow-y-auto">
                  {typeof activeInfo.content === 'string' ? (
                    <p>{activeInfo.content}</p>
                  ) : (
                    activeInfo.content
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Правая часть - галерея */}
          <div className="space-y-4 flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-4">Галерея</h3>
            
            {/* Основное изображение */}
            <Card className="relative overflow-hidden flex-1 flex flex-col">
              <div className="relative w-full flex-1 bg-gradient-to-br from-blue-100 to-cyan-100 min-h-[400px]">
                {!imageErrors.has(currentImageIndex) ? (
                  <Image
                    src={galleryImages[currentImageIndex]}
                    alt={`Фото ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => {
                      setImageErrors((prev) => new Set(prev).add(currentImageIndex));
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-200 to-cyan-200">
                    <div className="text-center text-gray-600">
                      <Building2 className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Фото {currentImageIndex + 1}</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-4 z-10 pointer-events-none">
                  <p className="text-white font-medium">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </p>
                </div>
                
                {/* Кнопки навигации */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </div>
            </Card>

            {/* Миниатюры */}
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index
                      ? "border-blue-600 ring-2 ring-blue-300"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  {!imageErrors.has(index) ? (
                    <Image
                      src={image}
                      alt={`Миниатюра ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={() => {
                        setImageErrors((prev) => new Set(prev).add(index));
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-200 to-cyan-200">
                      <Building2 className="h-6 w-6 text-gray-400 opacity-50" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

