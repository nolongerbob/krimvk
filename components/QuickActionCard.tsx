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
  publicAccess?: boolean; // Если true, доступно всем пользователям
  isPrimary?: boolean; // Главный CTA (передача показаний)
  isEmergency?: boolean; // Аварийная карточка
}

const iconMap = {
  Droplet,
  CreditCard,
  FileText,
  Wrench,
  AlertTriangle,
};

const primaryCardClass =
  'rounded-none border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-200/60 ring-2 ring-blue-200/80 hover:shadow-xl hover:shadow-blue-300/50 hover:scale-[1.02]';

const actionButtonClass =
  "w-full pointer-events-none rounded-none hover:scale-100 active:scale-100";

function QuickActionCardContent({
  iconName,
  title,
  description,
  iconColor,
  isPrimary,
  isEmergency,
}: Pick<QuickActionCardProps, "iconName" | "title" | "description" | "iconColor" | "isPrimary" | "isEmergency">) {
  const Icon = iconMap[iconName];
  const iconClassName = isEmergency
    ? "h-12 w-12 text-red-600"
    : isPrimary
      ? "h-12 w-12 text-blue-600"
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
  isPrimary,
  isEmergency,
  asChild = true,
  disabled = false,
}: {
  label: string;
  isPrimary?: boolean;
  isEmergency?: boolean;
  asChild?: boolean;
  disabled?: boolean;
}) {
  const btnClass = `${actionButtonClass} ${isEmergency ? "bg-red-600 hover:bg-red-700 text-white" : ""} ${isPrimary ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`;

  if (disabled) {
    return (
      <CardContent className="mt-auto px-5 pt-0 pb-3">
        <Button className={btnClass} disabled>
          {label}
        </Button>
      </CardContent>
    );
  }

  if (asChild) {
    return (
      <CardContent className="mt-auto px-5 pt-0 pb-3">
        <Button asChild className={btnClass} variant={isPrimary || isEmergency ? "default" : "outline"}>
          <span>{label}</span>
        </Button>
      </CardContent>
    );
  }

  return null;
}

export function QuickActionCard({ iconName, title, description, href, iconColor = "text-blue-500", publicAccess = false, isPrimary = false, isEmergency = false }: QuickActionCardProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const isLoading = status === "loading";

  // Если карточка доступна всем, показываем её всегда
  if (publicAccess) {
    return (
      <Link href={href} className="block">
        <Card className={`flex h-full flex-col cursor-pointer rounded-none transition-all group ${
          isEmergency 
            ? 'border-2 border-red-500 bg-red-50 hover:bg-red-100 hover:shadow-xl hover:scale-[1.02]' 
            : 'hover:shadow-lg'
        }`}>
          <QuickActionCardContent
            iconName={iconName}
            title={title}
            description={description}
            iconColor={iconColor}
            isEmergency={isEmergency}
          />
          <QuickActionCardFooter label={title} isEmergency={isEmergency} />
        </Card>
      </Link>
    );
  }

  if (isLoading) {
    return (
      <Card className={`flex h-full flex-col rounded-none ${isPrimary ? primaryCardClass : ""}`}>
        <QuickActionCardContent
          iconName={iconName}
          title={title}
          description={description}
          iconColor={iconColor}
          isPrimary={isPrimary}
        />
        <QuickActionCardFooter label="Загрузка..." isPrimary={isPrimary} disabled />
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="block h-full">
        <Card className={`group flex h-full flex-col cursor-pointer rounded-none transition-all ${
          isPrimary ? `${primaryCardClass} opacity-95` : 'opacity-75 hover:shadow-lg'
        }`}>
          <QuickActionCardContent
            iconName={iconName}
            title={title}
            description={description}
            iconColor={iconColor}
            isPrimary={isPrimary}
          />
          <QuickActionCardFooter
            label={isPrimary ? title : "Войти для доступа"}
            isPrimary={isPrimary}
          />
        </Card>
      </Link>
    );
  }

  return (
    <Link href={href} className="block h-full">
      <Card className={`group flex h-full flex-col cursor-pointer rounded-none transition-all ${
        isPrimary ? primaryCardClass : 'hover:shadow-lg'
      }`}>
        <QuickActionCardContent
          iconName={iconName}
          title={title}
          description={description}
          iconColor={iconColor}
          isPrimary={isPrimary}
        />
        <QuickActionCardFooter label={title} isPrimary={isPrimary} />
      </Card>
    </Link>
  );
}

