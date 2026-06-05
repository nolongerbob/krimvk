import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardTileClass } from "@/components/dashboard/dashboard-styles";

type AdminStatTileProps = {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName?: string;
  href?: string;
};

export function AdminStatTile({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName = "text-slate-600",
  href,
}: AdminStatTileProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <Icon className={cn("h-5 w-5 shrink-0", iconClassName)} strokeWidth={1.75} />
      </div>
      <div className="mt-4 text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(dashboardTileClass, "block p-5")}>
        {content}
      </Link>
    );
  }

  return <div className={cn(dashboardTileClass, "p-5")}>{content}</div>;
}
