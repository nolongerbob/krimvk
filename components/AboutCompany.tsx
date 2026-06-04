"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Building2, Users, Award, TrendingUp, ChevronLeft, ChevronRight, Droplet, Wrench, Rocket, UserCog, Shield, BookOpen, Construction, Cpu, Waves, Globe, Zap, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const iconBoxClass = "p-2 rounded-none mt-1";

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
              <div className={cn(iconBoxClass, "bg-blue-100")}>
                <Droplet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Масштаб:</p>
                <p className="text-gray-600">Обслуживаем 234 населенных пункта (более 177 000 жителей).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(iconBoxClass, "bg-orange-100")}>
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Инфраструктура:</p>
                <p className="text-gray-600">2 300 км сетей, 406 скважин и современные очистные сооружения.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(iconBoxClass, "bg-purple-100")}>
                <Rocket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Технологии:</p>
                <p className="text-gray-600">Внедрили дистанционное управление скважинами (IoT) и обновили автопарк на 100%.</p>
              </div>
            </div>
          </div>
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
              <div className={cn(iconBoxClass, "bg-blue-100")}>
                <UserCog className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Профессионализм:</p>
                <p className="text-gray-600">Высококвалифицированные инженеры и мастера, знающие каждый метр крымских коммуникаций.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(iconBoxClass, "bg-green-100")}>
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Надежность:</p>
                <p className="text-gray-600">Аварийные бригады работают в режиме 24/7, выезжая на устранение неполадок в любую погоду.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(iconBoxClass, "bg-purple-100")}>
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Развитие:</p>
                <p className="text-gray-600">Мы постоянно учимся, осваивая современное насосное оборудование и цифровые системы управления.</p>
              </div>
            </div>
          </div>
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
              <div className={cn(iconBoxClass, "bg-orange-100")}>
                <Construction className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Модернизация:</p>
                <p className="text-gray-600">Заменили более 40 км ветхих сетей и реализовали 112 проектов капитального ремонта в селах.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(iconBoxClass, "bg-blue-100")}>
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Инновации:</p>
                <p className="text-gray-600">Внедрили автоматику и дистанционный мониторинг на 189 скважинах, а также обновили насосное оборудование на энергоэффективное.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(iconBoxClass, "bg-cyan-100")}>
                <Waves className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="font-medium">Стабильность:</p>
                <p className="text-gray-600">Восстановили 30 заброшенных скважин, что позволило перевести водоснабжение населенных пунктов на круглосуточный режим.</p>
              </div>
            </div>
          </div>
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
              <div className={cn(iconBoxClass, "bg-green-100")}>
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Масштабирование:</p>
                <p className="text-gray-600">Расширение сети водоснабжения для подключения новых абонентов в отдаленных поселках.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(iconBoxClass, "bg-yellow-100")}>
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Энергоэффективность:</p>
                <p className="text-gray-600">Снижение затрат и углеродного следа за счет установки умного оборудования.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={cn(iconBoxClass, "bg-emerald-100")}>
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">Экология:</p>
                <p className="text-gray-600">Внедрение «зеленых» стандартов и улучшение качества очистки сточных вод.</p>
              </div>
            </div>
          </div>
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

const CARD_CHROME_HEIGHT = 56 + 16 + 48; // заголовок + отступ + padding
const GALLERY_THUMBS_HEIGHT = 96 + 16; // миниатюры + gap
const MIN_GALLERY_IMAGE_HEIGHT = 360;
const MIN_PANEL_HEIGHT = 640;

export function AboutCompany({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [panelHeight, setPanelHeight] = useState(MIN_PANEL_HEIGHT);
  const [isBviActive, setIsBviActive] = useState(false);
  const [bviImagesHidden, setBviImagesHidden] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncBvi = () => {
      const bviOn =
        document.documentElement.classList.contains("bvi-active") ||
        document.body.classList.contains("bvi-active");
      const imagesMode = document.querySelector(".bvi-body")?.getAttribute("data-bvi-images");
      setIsBviActive(bviOn);
      setBviImagesHidden(bviOn && imagesMode === "false");
    };
    syncBvi();
    const observer = new MutationObserver(syncBvi);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    const bviBody = document.querySelector(".bvi-body");
    if (bviBody) {
      observer.observe(bviBody, {
        attributes: true,
        attributeFilter: ["data-bvi-images"],
      });
    }
    window.addEventListener("bvi-layout-updated", syncBvi);
    return () => {
      observer.disconnect();
      window.removeEventListener("bvi-layout-updated", syncBvi);
    };
  }, []);

  useLayoutEffect(() => {
    const measurePanels = () => {
      if (
        document.documentElement.classList.contains("bvi-active") ||
        document.body.classList.contains("bvi-active")
      ) {
        return;
      }

      const root = measureRef.current;
      if (!root) return;

      const panels = root.querySelectorAll<HTMLElement>("[data-measure-panel]");
      let maxContent = 0;
      panels.forEach((panel) => {
        maxContent = Math.max(maxContent, panel.offsetHeight);
      });

      setPanelHeight(
        Math.max(
          maxContent + CARD_CHROME_HEIGHT,
          MIN_GALLERY_IMAGE_HEIGHT + GALLERY_THUMBS_HEIGHT,
          MIN_PANEL_HEIGHT
        )
      );
    };

    measurePanels();
    window.addEventListener("resize", measurePanels);
    window.addEventListener("bvi-layout-updated", measurePanels);
    return () => {
      window.removeEventListener("resize", measurePanels);
      window.removeEventListener("bvi-layout-updated", measurePanels);
    };
  }, [isBviActive]);

  const syncedPanelHeight =
    !isBviActive && panelHeight > 0 ? panelHeight : undefined;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const activeInfo = companyInfo[activeTab];
  const Icon = activeInfo.icon;
  const mainImageSrc = galleryImages[currentImageIndex];
  const showMainImage = !imageErrors.has(currentImageIndex);

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={cn(embedded ? "py-8 md:py-10 bg-white w-full" : "py-16 bg-white")}>
      <div className="about-company-section container relative mx-auto px-4">
        <h2 className={cn("font-semibold text-center tracking-tight", embedded ? "text-3xl md:text-4xl mb-8 md:mb-10" : "text-4xl mb-12")}>О компании</h2>

        {/* Скрытый замер всех табов — подбираем высоту без скролла */}
        <div
          ref={measureRef}
          className="pointer-events-none invisible absolute left-4 right-4 top-0 -z-10 lg:right-auto lg:w-[calc(50%-2rem)]"
          aria-hidden
        >
          {companyInfo.map((info) => (
            <div key={info.id} data-measure-panel className="text-base leading-relaxed text-gray-700">
              {info.content}
            </div>
          ))}
        </div>
        
        <div
          className={cn(
            "about-company-layout grid grid-cols-1 gap-x-8 gap-y-6 lg:gap-x-10",
            !bviImagesHidden && "lg:grid-cols-2 lg:items-stretch"
          )}
        >
          <div className="about-company-main flex min-w-0 flex-col gap-6">
            <div className="about-company-tabs flex flex-wrap gap-2">
              {companyInfo.map((info, index) => {
                const TabIcon = info.icon;
                return (
                  <button
                    key={info.id}
                    type="button"
                    onClick={() => setActiveTab(index)}
                    className={cn(
                      "about-company-tab bvi-no-styles flex items-center gap-2 rounded-none px-5 py-4 transition-colors duration-200",
                      activeTab === index
                        ? "bg-blue-600 text-white shadow-soft-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    <TabIcon className="about-company-tab-icon-svg h-4 w-4 shrink-0" />
                    <span className="about-company-tab-label text-sm font-medium">{info.title}</span>
                  </button>
                );
              })}
            </div>

            <Card
              className="about-company-panel flex flex-col rounded-none hover:translate-y-0"
              style={syncedPanelHeight ? { height: syncedPanelHeight } : undefined}
            >
              <CardContent className="flex h-full min-h-0 flex-col p-6">
                <div className="mb-4 flex h-14 shrink-0 items-center gap-3">
                  <div className="rounded-none bg-blue-100 p-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="line-clamp-2 text-2xl font-bold leading-tight">{activeInfo.title}</h3>
                </div>
                <div className="about-company-panel-content min-h-0 flex-1 overflow-hidden text-base leading-relaxed text-gray-700">
                  {typeof activeInfo.content === "string" ? (
                    <p>{activeInfo.content}</p>
                  ) : (
                    activeInfo.content
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {!bviImagesHidden && (
            <div className="about-company-aside flex min-w-0 flex-col gap-4">
          <h3 className="about-company-gallery-label inline-flex items-center self-center px-5 py-4 text-base font-semibold lg:self-end">
            Галерея
          </h3>

          <div
            className={cn(
              "about-company-gallery flex flex-col gap-4",
              !isBviActive && "min-h-[360px]",
              !isBviActive && !syncedPanelHeight && "lg:min-h-[640px]"
            )}
            style={syncedPanelHeight ? { height: syncedPanelHeight } : undefined}
          >
            {!isBviActive && (
              <Card className="about-company-gallery-card relative min-h-[360px] flex-1 overflow-hidden rounded-none hover:translate-y-0">
                <div className="about-company-gallery-viewer relative h-full min-h-[360px] w-full bg-gradient-to-br from-blue-100 to-cyan-100">
                  {showMainImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mainImageSrc}
                      alt={`Фото ${currentImageIndex + 1}`}
                      className="about-company-gallery-img about-company-gallery-img--hero bvi-no-style absolute inset-0 z-[1] h-full w-full object-cover"
                      onError={() => {
                        setImageErrors((prev) => new Set(prev).add(currentImageIndex));
                      }}
                    />
                  )}
                  {!showMainImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-200 to-cyan-200">
                      <div className="text-center text-gray-600">
                        <Building2 className="h-16 w-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Фото {currentImageIndex + 1}</p>
                      </div>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent p-4">
                    <p className="font-medium text-white">
                      {currentImageIndex + 1} / {galleryImages.length}
                    </p>
                  </div>

                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-none bg-white/80 p-2 shadow-lg transition-colors hover:bg-white"
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-none bg-white/80 p-2 shadow-lg transition-colors hover:bg-white"
                    aria-label="Следующее фото"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-800" />
                  </button>
                </div>
              </Card>
            )}

            <div className="grid shrink-0 grid-cols-3 gap-2">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "relative h-24 overflow-hidden rounded-none border-2 transition-colors",
                    currentImageIndex === index
                      ? "border-blue-600 ring-2 ring-blue-300"
                      : "border-transparent hover:border-gray-300"
                  )}
                >
                  {!imageErrors.has(index) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={`Миниатюра ${index + 1}`}
                      className="about-company-gallery-img bvi-no-style absolute inset-0 z-[1] h-full w-full object-cover"
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
          )}
        </div>
      </div>
    </Wrapper>
  );
}
