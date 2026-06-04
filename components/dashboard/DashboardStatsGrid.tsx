'use client';

import Link from 'next/link';
import { AlertCircle, Droplet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardTileClass } from '@/components/dashboard/dashboard-styles';

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
  icon: Icon,
  iconClassName = 'text-slate-600',
}: {
  href: string;
  title: string;
  value: number | string;
  subtitle: string;
  icon: typeof AlertCircle;
  iconClassName?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(dashboardTileClass, 'block p-5')}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <Icon className={cn('h-5 w-5 shrink-0', iconClassName)} strokeWidth={1.75} />
      </div>
      <div className="mt-4 text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
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
        icon={AlertCircle}
      />
      <StatTile
        href="/dashboard/meters"
        title="Счетчики"
        value={stats.metersCount}
        subtitle="Зарегистрировано"
        icon={Droplet}
        iconClassName="text-blue-600"
      />
      <StatTile
        href="/dashboard/applications"
        title="Активные заявки"
        value={stats.activeApplications}
        subtitle="В обработке"
        icon={FileText}
      />
    </div>
  );
}
