"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CreditCard,
  Droplet,
  FileText,
  LayoutGrid,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { signOutToHome } from "@/lib/client-sign-out";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { cn } from "@/lib/utils";

type HeaderProfileMenuProps = {
  session: {
    user: {
      name?: string | null;
      email?: string | null;
      role?: string | null;
    };
  };
  pathname: string;
  onLinkClick?: () => void;
};

const quickActions = [
  {
    href: "/dashboard/meters",
    label: "Передать показания",
    icon: Droplet,
    iconClass: "text-blue-600",
    boxClass: "bg-blue-50",
  },
  {
    href: "/emergency",
    label: "Сообщить об аварии",
    icon: AlertTriangle,
    iconClass: "text-red-600",
    boxClass: "bg-red-50",
  },
  {
    href: "/dashboard/bills",
    label: "Оплатить счёт",
    icon: CreditCard,
    iconClass: "text-green-600",
    boxClass: "bg-green-50",
  },
  {
    href: "/dashboard/applications",
    label: "Мои заявки",
    icon: FileText,
    iconClass: "text-gray-600",
    boxClass: "bg-gray-100",
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
      {children}
    </p>
  );
}

function QuickActionTile({
  href,
  label,
  icon: Icon,
  iconClass,
  boxClass,
  onLinkClick,
}: {
  href: string;
  label: string;
  icon: typeof Droplet;
  iconClass: string;
  boxClass: string;
  onLinkClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className="flex flex-col items-center justify-center gap-3 rounded-none border border-gray-100 bg-white px-3 py-5 text-center transition-all hover:border-blue-500"
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-none",
          boxClass
        )}
      >
        <Icon className={cn("h-5 w-5", iconClass)} />
      </span>
      <span className="text-sm leading-tight text-gray-900">{label}</span>
    </Link>
  );
}

function AccountMenuItem({
  title,
  icon: Icon,
  iconClass,
  active = false,
  href,
  onClick,
  trailing,
}: {
  title: string;
  icon: typeof LayoutGrid;
  iconClass?: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const className = cn(
    "flex w-full items-center gap-3 py-2.5 text-left text-base transition-colors rounded-none",
    "hover:text-primary",
    active && "font-semibold text-primary"
  );

  const content = (
    <>
      <Icon className={cn("h-5 w-5 shrink-0", iconClass ?? "text-gray-500")} />
      <span className={cn("min-w-0 flex-1", active ? "text-primary" : "text-gray-900")}>
        {title}
      </span>
      {trailing}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function HeaderProfileMenu({ session, pathname, onLinkClick }: HeaderProfileMenuProps) {
  const isAdmin = session.user.role === "ADMIN";
  const dashboardActive =
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/settings") &&
    !pathname.startsWith("/dashboard/meters") &&
    !pathname.startsWith("/dashboard/bills") &&
    !pathname.startsWith("/dashboard/applications");
  const settingsActive = pathname.startsWith("/dashboard/settings");
  const adminActive = pathname.startsWith("/admin");

  return (
    <div className="w-full border-t border-gray-200/60 bg-white/75 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="w-full px-6 py-8 sm:px-8 lg:px-14 lg:py-10 xl:px-20">
        <div className="grid w-full grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12 lg:gap-x-16 lg:gap-y-10">
          <div className="lg:col-span-3">
            <p className="text-base font-semibold text-gray-900">
              {session.user.name || "Пользователь"}
            </p>
            <p className="mt-1 text-sm text-gray-500">{session.user.email}</p>
          </div>

          <div className="lg:col-span-6">
            <SectionLabel>Быстрые действия</SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {quickActions.map((action) => (
                <QuickActionTile key={action.href} {...action} onLinkClick={onLinkClick} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <SectionLabel>Аккаунт</SectionLabel>
            <div className="space-y-1">
              <AccountMenuItem
                title="Личный кабинет"
                icon={LayoutGrid}
                iconClass={dashboardActive ? "text-primary" : "text-gray-500"}
                active={dashboardActive}
                href="/dashboard"
                onClick={onLinkClick}
              />
              <AccountMenuItem
                title="Настройки"
                icon={Settings}
                iconClass={settingsActive ? "text-primary" : "text-gray-500"}
                active={settingsActive}
                href="/dashboard/settings"
                onClick={onLinkClick}
              />
              {isAdmin && (
                <AccountMenuItem
                  title="Админ-панель"
                  icon={Shield}
                  iconClass={adminActive ? "text-primary" : "text-gray-500"}
                  active={adminActive}
                  href="/admin"
                  onClick={onLinkClick}
                  trailing={<AdminNotifications />}
                />
              )}
              <AccountMenuItem
                title="Выйти"
                icon={LogOut}
                onClick={() => {
                  onLinkClick?.();
                  void signOutToHome();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
