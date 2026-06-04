"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, CreditCard, FileText, Wrench, AlertTriangle } from "lucide-react";

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

const cardClass =
  "group flex h-full flex-col cursor-pointer rounded-none bg-white transition-all hover:shadow-lg";

const actionButtonClass =
  "w-full pointer-events-none rounded-none hover:scale-100 active:scale-100";

function QuickActionCardContent({
  iconName,
  title,
  description,
  iconColor,
  isEmergency,
}: Pick<QuickActionCardProps, "iconName" | "title" | "description" | "iconColor" | "isEmergency">) {
  const Icon = iconMap[iconName];
  const iconClassName = isEmergency
    ? "h-10 w-10 text-red-500"
    : `h-10 w-10 ${iconColor}`;

  return (
    <CardHeader className="flex flex-1 flex-col p-5 pb-2">
      <div className="mb-2 flex h-12 items-center">
        <Icon
          className={`${iconClassName} transition-transform duration-500 ease-out group-hover:scale-110`}
        />
      </div>
      <CardTitle className="mb-1.5 min-h-[2.75rem] text-lg leading-tight line-clamp-2">{title}</CardTitle>
      <CardDescription className="mb-0 min-h-[2rem] line-clamp-2">{description}</CardDescription>
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
    <CardContent className="mt-auto px-5 pt-0 pb-3">
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
      <Link href={href} className="block h-full">
        <Card className={cardClass}>
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
      <Card className={`${cardClass} h-full`}>
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
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="block h-full">
        <Card className={`${cardClass} opacity-75`}>
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
    <Link href={href} className="block h-full">
      <Card className={cardClass}>
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
