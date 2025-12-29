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
}

const iconMap = {
  Droplet,
  CreditCard,
  FileText,
  Wrench,
  AlertTriangle,
};

export function QuickActionCard({ iconName, title, description, href, iconColor = "text-blue-500", publicAccess = false }: QuickActionCardProps) {
  const Icon = iconMap[iconName];
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const isLoading = status === "loading";

  // Если карточка доступна всем, показываем её всегда
  if (publicAccess) {
    return (
      <Link href={href} className="block">
        <Card className="flex flex-col cursor-pointer group h-full">
          <CardHeader className="pb-4 flex-1">
            <Icon className={`h-10 w-10 ${iconColor} mb-3 transition-transform duration-500 ease-out group-hover:scale-110`} />
            <CardTitle className="mb-2">{title}</CardTitle>
            <CardDescription className="mb-0">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            <Button asChild className="w-full pointer-events-none">
              <span>{title}</span>
            </Button>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-4 flex-1">
          <Icon className={`h-10 w-10 ${iconColor} mb-3 transition-transform duration-500 ease-out`} />
          <CardTitle className="mb-2">{title}</CardTitle>
          <CardDescription className="mb-0">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <Button className="w-full" disabled>
            Загрузка...
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="block">
        <Card className="opacity-75 flex flex-col cursor-pointer group h-full">
          <CardHeader className="pb-4 flex-1">
            <Icon className={`h-10 w-10 ${iconColor} mb-3 transition-transform duration-500 ease-out`} />
            <CardTitle className="mb-2">{title}</CardTitle>
            <CardDescription className="mb-0">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            <Button asChild className="w-full pointer-events-none" variant="outline">
              <span>Войти для доступа</span>
            </Button>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={href} className="block">
      <Card className="flex flex-col cursor-pointer group h-full">
        <CardHeader className="pb-4 flex-1">
          <Icon className={`h-10 w-10 ${iconColor} mb-3 transition-transform duration-500 ease-out group-hover:scale-110`} />
          <CardTitle className="mb-2">{title}</CardTitle>
          <CardDescription className="mb-0">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <Button asChild className="w-full pointer-events-none">
            <span>{title}</span>
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

