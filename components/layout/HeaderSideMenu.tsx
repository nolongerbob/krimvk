"use client";

import Link from "next/link";
import { useState } from "react";
import type { Session } from "next-auth";
import { X, MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/Search";
import { BVIButton } from "@/components/BVIButton";
import { signOutToHome } from "@/lib/client-sign-out";
import { abonentyMegaMenu, companyMegaMenu } from "@/components/layout/HeaderMegaMenu";

type NavLink = { href: string; label: string };

type HeaderSideMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  session: Session | null;
  navLinks: NavLink[];
};

function isPathActive(pathname: string, path: string) {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function SideMenuLink({
  href,
  label,
  pathname,
  onClose,
}: {
  href: string;
  label: string;
  pathname: string;
  onClose: () => void;
}) {
  const active = isPathActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`header-side-menu-item block px-8 py-3 text-[22px] leading-tight font-normal transition-colors ${
        active ? "text-primary" : "text-gray-900 hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}

function SideMenuExpandable({
  label,
  pathname,
  prefix,
  sections,
  onClose,
  expanded,
  onToggle,
}: {
  label: string;
  pathname: string;
  prefix: string;
  sections: { title: string; links: { href: string; label: string }[] }[];
  onClose: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sectionActive = pathname.startsWith(prefix);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-8 py-3 text-left"
      >
        <span
          className={`header-side-menu-item text-[22px] leading-tight font-normal transition-colors ${
            sectionActive ? "text-primary" : "text-gray-900"
          }`}
        >
          {label}
        </span>
        <ChevronDown
          className={`h-6 w-6 shrink-0 stroke-[2] transition-transform duration-200 ${
            sectionActive ? "text-primary" : "text-gray-900"
          } ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {sections.flatMap((section) =>
            section.links.map((link) => {
              const active = !link.href.startsWith("tel:") && isPathActive(pathname, link.href);
              const className = `header-side-menu-sublink block px-8 py-2.5 pl-12 text-[17px] leading-snug transition-colors ${
                active ? "text-primary font-medium" : "text-gray-700 hover:text-primary"
              }`;

              if (link.href.startsWith("tel:")) {
                return (
                  <a key={link.href} href={link.href} className={className}>
                    {link.label}
                  </a>
                );
              }

              return (
                <Link key={link.href} href={link.href} onClick={onClose} className={className}>
                  {link.label}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function HeaderSideMenu({ isOpen, onClose, pathname, session, navLinks }: HeaderSideMenuProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <>
      <div
        className="header-side-menu-backdrop fixed inset-0 z-40 bg-black/20 backdrop-blur-sm 2xl:hidden animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="header-side-menu-panel bvi-no-styles fixed inset-y-0 right-0 z-50 flex w-[min(100%,520px)] flex-col bg-white 2xl:hidden animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Навигация"
      >
        {/* Верхняя панель: поиск, BVI, закрыть */}
        <div className="flex items-center justify-end gap-5 px-8 pt-7 pb-2">
          <Search mobileMode />
          <BVIButton />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-900 hover:text-primary transition-colors"
            aria-label="Закрыть меню"
          >
            <X className="h-7 w-7 stroke-[1.75]" />
          </button>
        </div>

        {/* Список разделов */}
        <div className="flex-1 overflow-y-auto overscroll-contain py-4 pb-2">
          {navLinks.map((link) => (
            <SideMenuLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
              onClose={onClose}
            />
          ))}

          <SideMenuExpandable
            label="Абонентам"
            prefix="/abonenty"
            pathname={pathname}
            sections={abonentyMegaMenu}
            onClose={onClose}
            expanded={expandedId === "abonenty"}
            onToggle={() => toggleSection("abonenty")}
          />

          <SideMenuExpandable
            label="О компании"
            prefix="/o-kompanii"
            pathname={pathname}
            sections={companyMegaMenu}
            onClose={onClose}
            expanded={expandedId === "company"}
            onToggle={() => toggleSection("company")}
          />

          <SideMenuExpandable
            label="Позвоните нам"
            prefix="/__phones__"
            pathname={pathname}
            sections={[
              {
                title: "Телефоны",
                links: [
                  { href: "tel:+79780800366", label: "+7 (978) 080-03-66" },
                  { href: "tel:+79884648724", label: "+7 (988) 464-87-24" },
                  { href: "tel:+79787013050", label: "АДС: +7 (978) 701-30-50" },
                  { href: "tel:+79787460990", label: "АДС: +7 (978) 746-09-90" },
                ],
              },
            ]}
            onClose={onClose}
            expanded={expandedId === "phones"}
            onToggle={() => toggleSection("phones")}
          />
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-white px-8 pt-7 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] space-y-4">
          {session ? (
            <>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="header-side-menu-footer-link block py-1.5 text-[20px] text-gray-900 hover:text-primary transition-colors"
              >
                Личный кабинет
              </Link>
              {(session.user.role === "ADMIN" || session.user?.role === "ADMIN") && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="header-side-menu-footer-link block py-1.5 text-[20px] text-gray-900 hover:text-primary transition-colors"
                >
                  Админ-панель
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  void signOutToHome();
                  onClose();
                }}
                className="header-side-menu-footer-link block py-1.5 text-[20px] text-gray-500 hover:text-primary transition-colors"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="header-side-menu-footer-link block py-1.5 text-[20px] text-gray-900 hover:text-primary transition-colors"
              >
                Войти
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="header-side-menu-footer-link block py-1.5 text-[20px] text-gray-900 hover:text-primary transition-colors"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function HeaderSideMenuToggle({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (isOpen) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="header-side-menu-toggle 2xl:hidden h-10 w-10 rounded-full hover:bg-gray-100"
      onClick={onToggle}
      aria-label="Ещё"
      aria-expanded={isOpen}
    >
      <MoreHorizontal className="h-5 w-5" />
    </Button>
  );
}
