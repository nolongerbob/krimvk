"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Droplet, CreditCard, FileText, Wrench, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { dashboardTileClass } from "@/components/dashboard/dashboard-styles";
import { siteOutlineBtnClass } from "@/components/site/site-styles";

interface QuickActionCardProps {
  iconName: "Droplet" | "CreditCard" | "FileText" | "Wrench" | "AlertTriangle";
  title: string;
  description: string;
  href: string;
  iconColor?: string;
  publicAccess?: boolean;
  isEmergency?: boolean;
  /** Контурная кнопка с цветным акцентом (как у аварии) */
  buttonAccent?: "blue";
}

const accentButtonClass = {
  blue: "border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700",
  red: "border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700",
} as const;

const iconMap = {
  Droplet,
  CreditCard,
  FileText,
  Wrench,
  AlertTriangle,
};

function cardClassName(isEmergency?: boolean) {
  return cn(
    dashboardTileClass,
    "quick-action-card bvi-no-styles bvi-preserve-ui group flex h-full min-h-0 flex-col cursor-pointer overflow-hidden",
    isEmergency && "quick-action-card--emergency"
  );
}

function QuickActionCardContent({
  iconName,
  title,
  description,
  iconColor,
  isEmergency,
}: Pick<QuickActionCardProps, "iconName" | "title" | "description" | "iconColor" | "isEmergency">) {
  const Icon = iconMap[iconName];
  const iconClassName = isEmergency
    ? "quick-action-card-icon-svg text-red-500"
    : cn("quick-action-card-icon-svg", iconColor);

  return (
    <div className="flex flex-1 flex-col p-5 pb-2">
      <div className="quick-action-card-icon mb-3 flex h-14 w-14 shrink-0 items-center justify-center">
        <Icon
          className={cn(
            "h-9 w-9 transition-transform duration-500 ease-out group-hover:scale-110",
            iconClassName
          )}
        />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold leading-snug text-slate-900">{title}</h3>
      <p className="mb-0 text-sm leading-snug text-slate-600">{description}</p>
    </div>
  );
}

function QuickActionCardFooter({
  label,
  isEmergency,
  buttonAccent,
  disabled = false,
}: {
  label: string;
  isEmergency?: boolean;
  buttonAccent?: "blue";
  disabled?: boolean;
}) {
  const accent = isEmergency ? accentButtonClass.red : buttonAccent ? accentButtonClass[buttonAccent] : "";
  const btnClass = cn(siteOutlineBtnClass, "quick-action-card-footer bvi-no-styles w-full max-w-full box-border pointer-events-none", accent);

  return (
    <DashboardCardBody className="quick-action-card-footer mt-auto shrink-0 px-5 pt-0 pb-4">
      <Button
        asChild={!disabled}
        className={btnClass}
        variant="outline"
        disabled={disabled}
      >
        {disabled ? label : <span>{label}</span>}
      </Button>
    </DashboardCardBody>
  );
}

export function QuickActionCard({
  iconName,
  title,
  description,
  href,
  iconColor = "text-blue-500",
  publicAccess = false,
  isEmergency = false,
  buttonAccent,
}: QuickActionCardProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const isLoading = status === "loading";

  if (publicAccess) {
    return (
      <Link href={href} className="quick-action-card-link block h-full min-h-0">
        <DashboardCard className={cardClassName(isEmergency)}>
          <QuickActionCardContent
            iconName={iconName}
            title={title}
            description={description}
            iconColor={iconColor}
            isEmergency={isEmergency}
          />
          <QuickActionCardFooter
            label={title}
            isEmergency={isEmergency}
            buttonAccent={buttonAccent}
          />
        </DashboardCard>
      </Link>
    );
  }

  if (isLoading) {
    return (
      <div className="quick-action-card-link flex h-full min-h-0 flex-col">
        <DashboardCard className={cn(cardClassName(), "flex-1")}>
          <QuickActionCardContent
            iconName={iconName}
            title={title}
            description={description}
            iconColor={iconColor}
          />
          <QuickActionCardFooter
            label="Загрузка..."
            buttonAccent={buttonAccent}
            disabled
          />
        </DashboardCard>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="quick-action-card-link block h-full min-h-0">
        <DashboardCard className={cn(cardClassName(), "opacity-75")}>
          <QuickActionCardContent
            iconName={iconName}
            title={title}
            description={description}
            iconColor={iconColor}
          />
          <QuickActionCardFooter label="Войти для доступа" buttonAccent={buttonAccent} />
        </DashboardCard>
      </Link>
    );
  }

  return (
    <Link href={href} className="quick-action-card-link block h-full min-h-0">
      <DashboardCard className={cardClassName()}>
        <QuickActionCardContent
          iconName={iconName}
          title={title}
          description={description}
          iconColor={iconColor}
        />
        <QuickActionCardFooter label={title} buttonAccent={buttonAccent} />
      </DashboardCard>
    </Link>
  );
}
