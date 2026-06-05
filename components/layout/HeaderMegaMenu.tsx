"use client";

import Link from "next/link";

export type MegaMenuId = "abonenty" | "company";

type MegaMenuLink = { href: string; label: string };
type MegaMenuSection = { title: string; links: MegaMenuLink[] };

export const abonentyMegaMenu: MegaMenuSection[] = [
  {
    title: "Услуги и подключение",
    links: [
      { href: "/abonenty/tehnologicheskoe-prisoedinenie", label: "Подключение" },
      { href: "/abonenty/kalkulyator-stoimosti-podklyucheniya", label: "Калькулятор стоимости подключения" },
      { href: "/abonenty/platy-uslugi/otkachka", label: "Заявка на откачку сточных вод" },
    ],
  },
  {
    title: "Тарифы",
    links: [
      { href: "/abonenty/tarify-podklyuchenie", label: "Тарифы на подключение" },
      { href: "/abonenty/tarify-vodosnabzhenie-vodootvedenie", label: "Тарифы на водоснабжение и водоотведение" },
    ],
  },
];

export const companyMegaMenu: MegaMenuSection[] = [
  {
    title: "О компании",
    links: [
      { href: "/o-kompanii/vakansii", label: "Вакансии" },
      { href: "/o-kompanii/istoriya", label: "История предприятия" },
      { href: "/o-kompanii/licenzii", label: "Лицензии и заключения" },
      { href: "/o-kompanii/razvitie", label: "Развитие" },
    ],
  },
  {
    title: "Раскрытие информации",
    links: [
      { href: "/o-kompanii/raskrytie/uchreditelnye-dokumenty", label: "Учредительные документы" },
      { href: "/o-kompanii/raskrytie/normativnye-dokumenty", label: "Нормативные документы" },
      { href: "/o-kompanii/raskrytie/informaciya-raskrytie", label: "Информация, подлежащая раскрытию" },
      { href: "/o-kompanii/raskrytie/zashchita-personalnyh-dannyh", label: "Защита персональных данных" },
      { href: "/o-kompanii/raskrytie/antikorrupciya", label: "Антикоррупционная политика" },
      { href: "/o-kompanii/raskrytie/investicionnaya-programma", label: "Инвестиционная программа" },
    ],
  },
  {
    title: "Водоснабжение",
    links: [
      { href: "/o-kompanii/vodosnabzhenie/struktura", label: "Структура водоснабжения" },
      { href: "/o-kompanii/kachestvo-vody", label: "Качество питьевой воды" },
    ],
  },
  {
    title: "Водоотведение",
    links: [
      { href: "/o-kompanii/kanalizovanie/struktura", label: "Структура водоотведения" },
    ],
  },
];

const menuMap: Record<MegaMenuId, MegaMenuSection[]> = {
  abonenty: abonentyMegaMenu,
  company: companyMegaMenu,
};

type HeaderMegaMenuProps = {
  menu: MegaMenuId;
  pathname: string;
  onLinkClick?: () => void;
};

function isLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderMegaMenu({ menu, pathname, onLinkClick }: HeaderMegaMenuProps) {
  const sections = menuMap[menu];

  return (
    <div className="header-mega-menu bvi-no-styles w-full max-w-full overflow-x-hidden border-t border-slate-200/60 bg-white/95 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="header-mega-menu-inner w-full max-w-full box-border px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div
          className={`header-mega-menu-grid grid w-full max-w-full gap-x-6 gap-y-6 sm:gap-x-10 sm:gap-y-8 lg:gap-x-14 lg:gap-y-10 ${
            menu === "abonenty"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          }`}
        >
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {section.title}
              </p>
              <ul className="space-y-3">
                {section.links.map((link) => {
                  const active = isLinkActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onLinkClick}
                        className={`bvi-no-styles group/link relative block max-w-full text-base leading-snug transition-colors ${
                          active
                            ? "font-semibold text-primary"
                            : "text-slate-900 hover:text-primary"
                        }`}
                      >
                        <span className="relative">
                          {link.label}
                          <span
                            aria-hidden
                            className={`absolute -bottom-0.5 left-0 h-[2px] bg-primary transition-[width] duration-300 ease-out ${
                              active ? "w-full" : "w-0 group-hover/link:w-full"
                            }`}
                          />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
