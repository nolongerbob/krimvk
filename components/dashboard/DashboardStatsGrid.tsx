'use client';

import Link from 'next/link';
import { AlertCircle, Droplet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type Stats = {
  unpaidBills: number;
  totalAmount: number;
  metersCount: number;
  activeApplications: number;
};

function StatTile({
  href,
  title,
  value,
  subtitle,
  icon,
  iconBoxClassName,
}: {
  href: string;
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconBoxClassName?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-none border border-gray-100 bg-white p-5 transition-all duration-200",
        "hover:border-blue-500 hover:bg-gray-50/80 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-none",
            iconBoxClassName ?? "bg-gray-100"
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold text-gray-900">{value}</div>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </Link>
  );
}

export function DashboardStatsGrid({ stats }: { stats: Stats }) {
  return (
    <div
      className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      data-tour-id="tour-stats"
    >
      <StatTile
        href="/dashboard/bills"
        title="Неоплаченные счета"
        value={stats.unpaidBills}
        subtitle={`На сумму ${stats.totalAmount.toLocaleString('ru-RU')} ₽`}
        icon={<AlertCircle className="h-5 w-5 text-gray-600" />}
      />
      <StatTile
        href="/dashboard/meters"
        title="Счетчики"
        value={stats.metersCount}
        subtitle="Зарегистрировано"
        icon={<Droplet className="h-5 w-5 text-blue-600" />}
        iconBoxClassName="bg-blue-50"
      />
      <StatTile
        href="/dashboard/applications"
        title="Активные заявки"
        value={stats.activeApplications}
        subtitle="В обработке"
        icon={<FileText className="h-5 w-5 text-gray-600" />}
      />
    </div>
  );
}
