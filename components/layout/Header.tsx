"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, ChevronDown, Phone } from "lucide-react";
import { Search } from "@/components/Search";
import { BVIButton } from "@/components/BVIButton";
import { HeaderMegaMenu, type MegaMenuId } from "@/components/layout/HeaderMegaMenu";
import { HeaderPhoneMenu } from "@/components/layout/HeaderPhoneMenu";
import { HeaderProfileMenu } from "@/components/layout/HeaderProfileMenu";
import { HeaderSideMenu, HeaderSideMenuToggle } from "@/components/layout/HeaderSideMenu";
import { useState, useEffect, useRef } from "react";

function NavUnderline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute -bottom-1.5 h-[2px] bg-gray-400 transition-[width,left] duration-500 ease-in-out ${
        active
          ? "left-0 w-full"
          : "left-full w-0 group-hover/nav:left-0 group-hover/nav:w-full"
      }`}
    />
  );
}

function navItemClass(active: boolean) {
  return `relative flex items-center h-full px-1.5 text-base font-medium whitespace-nowrap transition-colors group/nav ${
    active ? "text-primary font-semibold" : "text-slate-900 hover:text-primary"
  }`;
}

function NavItemLabel({ children }: { children: React.ReactNode }) {
  return <span className="relative inline-flex items-center gap-1">{children}</span>;
}

const headerSquareBtn =
  "flex h-full w-14 lg:w-[4.5rem] shrink-0 items-center justify-center border-l border-slate-200 rounded-none hover:bg-slate-50 transition-colors focus:outline-none focus-visible:outline-none";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenu, setMegaMenu] = useState<MegaMenuId | "phone" | "profile" | null>(null);
  const megaMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const openMegaMenu = (menu: MegaMenuId | "phone" | "profile") => {
    if (megaMenuCloseTimer.current) {
      clearTimeout(megaMenuCloseTimer.current);
      megaMenuCloseTimer.current = null;
    }
    setMegaMenu(menu);
  };

  const scheduleCloseMegaMenu = () => {
    if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
    megaMenuCloseTimer.current = setTimeout(() => setMegaMenu(null), 200);
  };

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

  useEffect(() => {
    return () => {
      if (megaMenuCloseTimer.current) clearTimeout(megaMenuCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    setMegaMenu(null);
    setMobileMenuOpen(false);
  }, [pathname]);


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
    <header id="site-header" className="site-header-root bvi-no-styles sticky top-0 z-50 w-full bg-white">
      <div className="relative">
      <div data-header-inner className="relative w-full flex h-16 lg:h-[4.5rem] items-stretch pr-0">
        <div className="flex flex-1 min-w-0 items-stretch border-b border-slate-200 pl-3 sm:pl-4 lg:pl-6 xl:pl-8">
        {/* Левая часть: Логотип */}
        <div className="flex items-center flex-shrink-0 z-10 self-center">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Крымская Водная Компания"
              width={48}
              height={48}
              className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
            />
            <span className="text-base sm:text-lg lg:text-xl font-bold hidden sm:inline text-slate-900">КрымВК</span>
          </Link>
        </div>
        </div>

        {/* Центр: Навигация */}
        <nav className="header-desktop-nav hidden 2xl:flex absolute left-1/2 -translate-x-[calc(50%+5.5rem)] top-0 h-full items-stretch gap-8 lg:gap-9 xl:gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navItemClass(isActive(link.href))}
              >
                <NavItemLabel>
                  {link.label}
                  <NavUnderline active={isActive(link.href)} />
                </NavItemLabel>
              </Link>
            ))}
            
            {/* Абонентам */}
            <div
              className="relative h-full"
              onMouseEnter={() => openMegaMenu("abonenty")}
              onMouseLeave={scheduleCloseMegaMenu}
            >
              <button
                type="button"
                className={navItemClass(pathname.startsWith("/abonenty"))}
              >
                <NavItemLabel>
                  Абонентам
                  <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${megaMenu === "abonenty" ? "rotate-180" : ""}`} />
                  <NavUnderline active={pathname.startsWith("/abonenty") || megaMenu === "abonenty"} />
                </NavItemLabel>
              </button>
            </div>

            {/* О компании */}
            <div
              className="relative h-full"
              onMouseEnter={() => openMegaMenu("company")}
              onMouseLeave={scheduleCloseMegaMenu}
            >
              <button
                type="button"
                className={navItemClass(pathname.startsWith("/o-kompanii"))}
              >
                <NavItemLabel>
                  О компании
                  <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${megaMenu === "company" ? "rotate-180" : ""}`} />
                  <NavUnderline active={pathname.startsWith("/o-kompanii") || megaMenu === "company"} />
                </NavItemLabel>
              </button>
            </div>
          </nav>

        {/* Правая часть */}
        <div className="flex items-stretch h-full flex-shrink-0 z-10 ml-auto">
          <div className="header-desktop-toolbar hidden 2xl:flex items-stretch h-full border-b border-slate-200">
            <div className={headerSquareBtn}>
              <Search inHeader />
            </div>

            <div
              className={cn(
                "relative flex h-full w-14 shrink-0 border-l border-slate-200 lg:w-[4.5rem]",
                megaMenu === "phone" && "bg-slate-50"
              )}
              onMouseEnter={() => openMegaMenu("phone")}
              onMouseLeave={scheduleCloseMegaMenu}
            >
              <button
                type="button"
                className={`${headerSquareBtn} w-full border-l-0`}
                aria-label="Позвоните нам"
                aria-expanded={megaMenu === "phone"}
              >
                <Phone className="h-5 w-5 lg:h-6 lg:w-6" />
              </button>
            </div>

            <div className={headerSquareBtn}>
              <BVIButton className="h-full w-full rounded-none hover:bg-transparent hover:scale-100 active:scale-100 [&_svg]:h-5 [&_svg]:w-5 lg:[&_svg]:h-6 lg:[&_svg]:w-6" />
            </div>
          </div>

          {status === "loading" ? (
            <div className="hidden 2xl:block h-full w-28 animate-pulse border-b border-l border-slate-200 bg-gray-200" />
          ) : session ? (
            <div
              className={cn(
                "header-desktop-auth relative hidden h-full border-b border-l border-slate-200 2xl:flex",
                megaMenu === "profile" && "bg-slate-50"
              )}
              onMouseEnter={() => openMegaMenu("profile")}
              onMouseLeave={scheduleCloseMegaMenu}
            >
              <button
                type="button"
                className="flex h-full items-center gap-2 px-4 text-base transition-colors hover:bg-slate-50 focus:outline-none lg:px-5"
                aria-expanded={megaMenu === "profile"}
              >
                <User className="h-5 w-5" />
                <span className="max-w-[100px] truncate xl:max-w-[150px]">
                  {session.user.name || session.user.email}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    megaMenu === "profile" && "rotate-180"
                  )}
                />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "header-desktop-auth-link hidden 2xl:inline-flex self-stretch h-full min-h-full rounded-none border-b border-l border-slate-200 px-4 lg:px-5 text-base py-0 hover:scale-100 active:scale-100"
                )}
              >
                Войти
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "header-desktop-auth-link hidden 2xl:inline-flex self-stretch h-full min-h-full rounded-none border-b-0 px-6 lg:px-10 text-base py-0 hover:scale-100 active:scale-100"
                )}
              >
                Регистрация
              </Link>
            </>
          )}

          <div className="header-mobile-toggle flex items-center self-center px-2 2xl:hidden">
            <HeaderSideMenuToggle
              isOpen={mobileMenuOpen}
              onToggle={() => {
                setMegaMenu(null);
                setMobileMenuOpen((open) => !open);
              }}
            />
          </div>
        </div>
      </div>

      {megaMenu && (
        <div
          className="header-mega-dropdown hidden 2xl:block absolute left-0 right-0 top-full z-40"
          onMouseEnter={() => openMegaMenu(megaMenu)}
          onMouseLeave={scheduleCloseMegaMenu}
        >
          {megaMenu === "phone" ? (
            <HeaderPhoneMenu session={session ?? null} onLinkClick={() => setMegaMenu(null)} />
          ) : megaMenu === "profile" ? (
            session ? (
              <HeaderProfileMenu
                session={session}
                pathname={pathname}
                onLinkClick={() => setMegaMenu(null)}
              />
            ) : null
          ) : (
            <HeaderMegaMenu
              menu={megaMenu}
              pathname={pathname}
              onLinkClick={() => setMegaMenu(null)}
            />
          )}
        </div>
      )}
      </div>


      <HeaderSideMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        pathname={pathname}
        session={session ?? null}
        navLinks={navLinks}
      />
    </header>
  );
}

