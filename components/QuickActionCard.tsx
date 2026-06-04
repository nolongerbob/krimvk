"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, CreditCard, FileText, Wrench, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

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

const cardBaseClass =
  "quick-action-card bvi-no-styles bvi-preserve-ui group flex h-full min-h-0 flex-col cursor-pointer overflow-hidden rounded-none border border-gray-200 bg-white transition-all hover:shadow-lg";

function cardClassName(isEmergency?: boolean) {
  return cn(cardBaseClass, isEmergency && "quick-action-card--emergency");
}

const actionButtonClass =
  "bvi-no-styles w-full max-w-full box-border pointer-events-none rounded-none hover:scale-100 active:scale-100";

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
    <CardHeader className="flex flex-1 flex-col p-5 pb-2">
      <div className="quick-action-card-icon mb-3 flex h-14 w-14 shrink-0 items-center justify-center">
        <Icon
          className={cn(
            "h-9 w-9 transition-transform duration-500 ease-out group-hover:scale-110",
            iconClassName
          )}
        />
      </div>
      <CardTitle className="mb-1.5 text-lg leading-snug">{title}</CardTitle>
      <CardDescription className="mb-0 leading-snug">{description}</CardDescription>
    </CardHeader>
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
  const btnClass = `${actionButtonClass} ${accent}`;

  return (
    <CardContent className="quick-action-card-footer mt-auto shrink-0 px-5 pt-0 pb-4">
      <Button
        asChild={!disabled}
        className={btnClass}
        variant="outline"
        disabled={disabled}
      >
        {disabled ? label : <span>{label}</span>}
      </Button>
    </CardContent>
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
        <Card className={cardClassName(isEmergency)}>
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
        </Card>
      </Link>
    );
  }

  if (isLoading) {
    return (
      <div className="quick-action-card-link flex h-full min-h-0 flex-col">
      <Card className={cn(cardClassName(), "flex-1")}>
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
      </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="quick-action-card-link block h-full min-h-0">
        <Card className={cn(cardClassName(), "opacity-75")}>
          <QuickActionCardContent
            iconName={iconName}
            title={title}
            description={description}
            iconColor={iconColor}
          />
          <QuickActionCardFooter label="Войти для доступа" buttonAccent={buttonAccent} />
        </Card>
      </Link>
    );
  }

  return (
    <Link href={href} className="quick-action-card-link block h-full min-h-0">
      <Card className={cardClassName()}>
        <QuickActionCardContent
          iconName={iconName}
          title={title}
          description={description}
          iconColor={iconColor}
        />
        <QuickActionCardFooter label={title} buttonAccent={buttonAccent} />
      </Card>
    </Link>
  );
}
