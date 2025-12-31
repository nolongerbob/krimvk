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

export function QuickActionCard({ iconName, title, description, href, iconColor = "text-blue-500", publicAccess = false, isPrimary = false, isEmergency = false }: QuickActionCardProps) {
  const Icon = iconMap[iconName];
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const isLoading = status === "loading";

  // Если карточка доступна всем, показываем её всегда
  if (publicAccess) {
    return (
      <Link href={href} className={`block ${isEmergency ? 'md:col-span-2 lg:col-span-1' : ''}`}>
        <Card className={`flex flex-col cursor-pointer group h-full transition-all ${
          isEmergency 
            ? 'border-2 border-red-500 bg-red-50 hover:bg-red-100 hover:shadow-xl hover:scale-105' 
            : 'hover:shadow-lg'
        }`}>
          <CardHeader className={`pb-4 flex-1 ${isEmergency ? 'pb-6' : ''}`}>
            <Icon className={`${isEmergency ? 'h-14 w-14 text-red-600' : `h-10 w-10 ${iconColor}`} mb-3 transition-transform duration-500 ease-out group-hover:scale-110`} />
            <CardTitle className={`${isEmergency ? 'text-xl text-red-900' : 'mb-2'}`}>{title}</CardTitle>
            <CardDescription className={isEmergency ? 'text-red-800 font-medium' : 'mb-0'}>{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            <Button asChild className={`w-full pointer-events-none ${isEmergency ? 'bg-red-600 hover:bg-red-700 text-white text-base py-6' : ''}`}>
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
    <Link href={href} className={`block ${isPrimary ? 'md:col-span-2 lg:col-span-2' : ''}`}>
      <Card className={`flex flex-col cursor-pointer group h-full transition-all ${
        isPrimary 
          ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl hover:scale-[1.02]' 
          : 'hover:shadow-lg'
      }`}>
        <CardHeader className={`pb-4 flex-1 ${isPrimary ? 'pb-6' : ''}`}>
          <Icon className={`${isPrimary ? 'h-14 w-14 text-blue-600' : `h-10 w-10 ${iconColor}`} mb-3 transition-transform duration-500 ease-out group-hover:scale-110`} />
          <CardTitle className={isPrimary ? 'text-xl mb-2' : 'mb-2'}>{title}</CardTitle>
          <CardDescription className={isPrimary ? 'text-base' : 'mb-0'}>{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <Button asChild className={`w-full pointer-events-none ${isPrimary ? 'bg-blue-600 hover:bg-blue-700 text-white text-base py-6' : ''}`}>
            <span>{title}</span>
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

