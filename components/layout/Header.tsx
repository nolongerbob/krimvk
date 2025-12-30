"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, ChevronDown, Eye, Phone, MessageSquare, X, Home, Briefcase, Newspaper, Mail, Users, FileText, Building2, History, Award, TrendingUp, FileCheck, Shield, Scale, Info, Droplet, Waves, Search as SearchIcon, Settings } from "lucide-react";
import { Search } from "@/components/Search";
import { BVIButton } from "@/components/BVIButton";
import { useState, useEffect } from "react";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Блокируем скролл когда меню открыто
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Отладка роли (можно убрать после проверки)
  if (typeof window !== 'undefined' && session?.user) {
    console.log('=== DEBUG SESSION ===');
    console.log('User role in session:', session.user.role);
    console.log('User email:', session.user.email);
    console.log('Full session.user:', session.user);
    console.log('===================');
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: "/", label: "Главная" },
    { href: "/services", label: "Услуги" },
    { href: "/news", label: "Новости" },
    { href: "/contact", label: "Контакты" },
  ];

  return (
    <div className="px-2 sm:px-4 md:px-6 lg:px-8">
      <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-br from-blue-200/90 via-blue-100/90 to-cyan-100/90 backdrop-blur-sm rounded-t-2xl rounded-b-2xl mt-2">
        <div className="w-full flex h-20 lg:h-24 items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Левая часть: Логотип */}
        <div className="flex items-center flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <Image
              src="/images/logo.png"
              alt="Крымская Водная Компания"
              width={60}
              height={60}
              className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16"
            />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold hidden sm:inline lg:inline">КрымВК</span>
          </Link>
        </div>

        {/* Центральная часть: Навигация + Кнопки */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center min-w-0">
          <nav className="hidden xl:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(link.href)
                    ? "text-primary"
                    : "hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Абонентам */}
            <DropdownMenu>
              <DropdownMenuTrigger className={`text-xs xl:text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                pathname.startsWith("/abonenty")
                  ? "text-primary"
                  : "hover:text-primary"
              }`}>
                Абонентам
                <ChevronDown className="h-3 w-3 xl:h-4 xl:w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem asChild>
                  <Link href="/abonenty/platy-uslugi/otkachka">Заявка на откачку сточных вод</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/abonenty/platy-uslugi/podklyuchenie">Подключение</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/abonenty/tarify-podklyuchenie">Тарифы на подключение и расчет стоимости</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/abonenty/tarify-proektirovanie">Тарифы на проектирование</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/abonenty/tehnologicheskoe-prisoedinenie">Технологическое присоединение</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* О компании */}
            <DropdownMenu>
              <DropdownMenuTrigger className={`text-xs xl:text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                pathname.startsWith("/o-kompanii")
                  ? "text-primary"
                  : "hover:text-primary"
              }`}>
                О компании
                <ChevronDown className="h-3 w-3 xl:h-4 xl:w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuItem asChild>
                  <Link href="/o-kompanii/rukovodstvo">Руководство</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/o-kompanii/vakansii">Вакансии</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/o-kompanii/istoriya">История предприятия</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/o-kompanii/licenzii">Лицензии и заключения</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/o-kompanii/razvitie">Развитие</Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Раскрытие информации</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/raskrytie/uchreditelnye-dokumenty">Учредительные документы</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/raskrytie/normativnye-dokumenty">Нормативные документы</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/raskrytie/informaciya-raskrytie">Информация, подлежащая раскрытию</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/raskrytie/zashchita-personalnyh-dannyh">Защита персональных данных</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/raskrytie/antikorrupciya">Антикоррупционная политика</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/raskrytie/investicionnaya-programma">Инвестиционная программа</Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Водоснабжение</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/vodosnabzhenie/struktura">Структура водоснабжения</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/vodosnabzhenie/kachestvo-vody">Качество воды</Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Водоотведение</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link href="/o-kompanii/kanalizovanie/struktura">Структура водоотведения</Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Поиск */}
          <div className="hidden xl:block ml-4">
            <Search />
          </div>
          
          {/* Кнопка версии для слабовидящих */}
          <div className="hidden xl:block">
            <BVIButton />
          </div>
          
          {/* Позвоните нам - выпадающее меню */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden xl:flex items-center gap-1.5 text-xs xl:text-sm px-1.5 xl:px-2 focus:outline-none focus-visible:outline-none active:outline-none">
                <Phone className="h-3 w-3 xl:h-4 xl:w-4" />
                <span className="whitespace-nowrap">Позвоните нам</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 lg:w-80">
              <DropdownMenuLabel className="text-xs">Прием показаний водомеров ХВС</DropdownMenuLabel>
              <DropdownMenuItem asChild className="py-2.5">
                <a href="tel:+79780800366" className="cursor-pointer flex flex-col w-full">
                  <span className="font-medium text-sm">+7 (978) 080-03-66</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-2.5">
                <a href="tel:+79787415759" className="cursor-pointer flex flex-col w-full">
                  <span className="font-medium text-sm">+7 (978) 741-57-59</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">с 8:00 до 17:00 по будням, в пятницу c 8:00 до 16:00</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-red-600">Аварийно-диспетчерская служба</DropdownMenuLabel>
              <DropdownMenuItem asChild className="py-2.5">
                <a href="tel:+79787013050" className="cursor-pointer flex flex-col w-full">
                  <span className="font-medium text-sm text-red-600">+7 (978) 701-30-50</span>
                  <span className="text-xs text-muted-foreground">Круглосуточно</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-2.5">
                <a href="tel:+79787460990" className="cursor-pointer flex flex-col w-full">
                  <span className="font-medium text-sm text-red-600">+7 (978) 746-09-90</span>
                  <span className="text-xs text-muted-foreground">Круглосуточно</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Онлайн-чат</DropdownMenuLabel>
              <DropdownMenuItem asChild className="py-2.5">
                <Link href={session ? "/dashboard/questions" : "/login?callbackUrl=/dashboard/questions"} className="cursor-pointer flex items-center gap-2 w-full">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Написать в чате</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Правая часть: Пользователь */}
        <div className="flex items-center flex-shrink-0">
          {status === "loading" ? (
            <div className="hidden xl:block w-20 h-9 bg-gray-200 animate-pulse rounded"></div>
          ) : session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden xl:flex items-center gap-2 text-xs xl:text-sm focus:outline-none focus-visible:outline-none active:outline-none">
                    <User className="h-3 w-3 xl:h-4 xl:w-4" />
                    <span className="max-w-[100px] xl:max-w-[150px] truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 min-w-[240px]">
                  <DropdownMenuLabel className="px-3 py-2.5">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name || "Пользователь"}</p>
                      <p className="text-xs text-muted-foreground break-all">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="px-3 py-2.5">
                    <Link href="/dashboard" className="cursor-pointer w-full">
                      Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="px-3 py-2.5">
                    <Link href="/dashboard/settings" className="cursor-pointer w-full flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Настройки
                    </Link>
                  </DropdownMenuItem>
                  {(session.user.role === "ADMIN" || session.user?.role === "ADMIN") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="px-3 py-2.5">
                        <Link href="/admin" className="cursor-pointer flex items-center justify-between w-full">
                          <span>Админ-панель</span>
                          <AdminNotifications />
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* Временная отладка - показываем админку всегда для проверки */}
                  {session.user.email === "admin@krimvk.ru" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="px-3 py-2.5">
                        <Link href="/admin" className="cursor-pointer w-full">
                          Админ-панель (по email)
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-red-600 px-3 py-2.5"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden xl:inline-flex text-xs xl:text-sm focus:outline-none focus-visible:outline-none active:outline-none">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild size="sm" className="hidden xl:inline-flex text-xs xl:text-sm focus:outline-none focus-visible:outline-none active:outline-none">
                <Link href="/register">Регистрация</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Мобильное меню - полноэкранное slide-in */}
      {mobileMenuOpen && (
        <>
          {/* Затемнение фона */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 xl:hidden animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Само меню */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl z-50 xl:hidden transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
            <div className="flex flex-col h-full">
              {/* Заголовок меню */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-br from-blue-200 via-blue-100 to-cyan-100">
                <h2 className="text-lg font-bold text-gray-900">Меню</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Контент меню с прокруткой */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-1">
                  {/* Основные ссылки */}
                  {navLinks.map((link) => {
                    const iconMap: { [key: string]: any } = {
                      "/": Home,
                      "/services": Briefcase,
                      "/news": Newspaper,
                      "/contact": Mail,
                    };
                    const Icon = iconMap[link.href] || Home;
                    
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive(link.href)
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-base">{link.label}</span>
                      </Link>
                    );
                  })}

                  {/* Абонентам - аккордеон */}
                  <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="abonenty" className="border-none">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline rounded-lg hover:bg-gray-100">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="text-base font-medium text-gray-900">Абонентам</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="space-y-1 pl-4">
                          <Link
                            href="/abonenty/platy-uslugi/otkachka"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Droplet className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Заявка на откачку сточных вод</span>
                          </Link>
                          <Link
                            href="/abonenty/platy-uslugi/podklyuchenie"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Подключение</span>
                          </Link>
                          <Link
                            href="/abonenty/tarify-podklyuchenie"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Тарифы на подключение</span>
                          </Link>
                          <Link
                            href="/abonenty/tarify-proektirovanie"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Тарифы на проектирование</span>
                          </Link>
                          <Link
                            href="/abonenty/tehnologicheskoe-prisoedinenie"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Технологическое присоединение</span>
                          </Link>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* О компании - аккордеон */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="about" className="border-none">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline rounded-lg hover:bg-gray-100">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <span className="text-base font-medium text-gray-900">О компании</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="space-y-1 pl-4">
                          <Link
                            href="/o-kompanii/rukovodstvo"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Руководство</span>
                          </Link>
                          <Link
                            href="/o-kompanii/vakansii"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Briefcase className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Вакансии</span>
                          </Link>
                          <Link
                            href="/o-kompanii/istoriya"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <History className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">История предприятия</span>
                          </Link>
                          <Link
                            href="/o-kompanii/licenzii"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <FileCheck className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Лицензии и заключения</span>
                          </Link>
                          <Link
                            href="/o-kompanii/razvitie"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <TrendingUp className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">Развитие</span>
                          </Link>
                          
                          {/* Подменю: Раскрытие информации */}
                          <Accordion type="single" collapsible className="w-full mt-2">
                            <AccordionItem value="raskrytie" className="border-none">
                              <AccordionTrigger className="px-4 py-2 hover:no-underline rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <Info className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">Раскрытие информации</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-2">
                                <div className="space-y-1 pl-4">
                                  <Link
                                    href="/o-kompanii/raskrytie/uchreditelnye-dokumenty"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Учредительные документы</span>
                                  </Link>
                                  <Link
                                    href="/o-kompanii/raskrytie/normativnye-dokumenty"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Нормативные документы</span>
                                  </Link>
                                  <Link
                                    href="/o-kompanii/raskrytie/informaciya-raskrytie"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Информация, подлежащая раскрытию</span>
                                  </Link>
                                  <Link
                                    href="/o-kompanii/raskrytie/zashchita-personalnyh-dannyh"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Защита персональных данных</span>
                                  </Link>
                                  <Link
                                    href="/o-kompanii/raskrytie/antikorrupciya"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <Scale className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Антикоррупционная политика</span>
                                  </Link>
                                  <Link
                                    href="/o-kompanii/raskrytie/investicionnaya-programma"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Инвестиционная программа</span>
                                  </Link>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          {/* Подменю: Водоснабжение */}
                          <Accordion type="single" collapsible className="w-full mt-2">
                            <AccordionItem value="vodosnabzhenie" className="border-none">
                              <AccordionTrigger className="px-4 py-2 hover:no-underline rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <Droplet className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">Водоснабжение</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-2">
                                <div className="space-y-1 pl-4">
                                  <Link
                                    href="/o-kompanii/vodosnabzhenie/struktura"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Структура водоснабжения</span>
                                  </Link>
                                  <Link
                                    href="/o-kompanii/vodosnabzhenie/kachestvo-vody"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <Droplet className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Качество воды</span>
                                  </Link>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          {/* Подменю: Канализование */}
                          <Accordion type="single" collapsible className="w-full mt-2">
                            <AccordionItem value="kanalizovanie" className="border-none">
                              <AccordionTrigger className="px-4 py-2 hover:no-underline rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <Waves className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">Водоотведение</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-2">
                                <div className="space-y-1 pl-4">
                                  <Link
                                    href="/o-kompanii/kanalizovanie/struktura"
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>Структура водоотведения</span>
                                  </Link>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Поиск в мобильном меню */}
                  <div className="pt-4 border-t mt-4">
                    <div className="px-4">
                      <div className="w-full">
                        <Search mobileMode={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Футер меню с кнопками входа/регистрации */}
              <div className="p-4 border-t bg-gray-50 space-y-2">
                {session ? (
                  <>
                    <div className="px-2 py-2 text-sm bg-white rounded-lg mb-2">
                      <p className="font-medium text-gray-900">{session.user.name || session.user.email}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                    </div>
                    <Button asChild className="w-full" size="lg">
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Личный кабинет
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" size="lg">
                      <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Настройки
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      size="lg"
                      onClick={() => {
                        signOut({ callbackUrl: "/" });
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full" size="lg">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Войти
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" size="lg">
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        Регистрация
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      </header>
    </div>
  );
}

