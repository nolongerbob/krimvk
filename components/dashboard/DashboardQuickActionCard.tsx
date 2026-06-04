"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardTileClass } from "@/components/dashboard/dashboard-styles";

type Props = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
};

export function DashboardQuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  iconClassName = "text-slate-600",
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        dashboardTileClass,
        "flex h-full flex-col gap-3 p-5"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", iconClassName)} strokeWidth={1.75} />
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <p className="text-base font-semibold leading-snug text-slate-900">{title}</p>
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
