'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Droplet, FileText } from 'lucide-react';

type Stats = {
  unpaidBills: number;
  totalAmount: number;
  metersCount: number;
  activeApplications: number;
};

export function DashboardStatsGrid({ stats }: { stats: Stats }) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      data-tour-id="tour-stats"
    >
      <Link href="/dashboard/bills">
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">Неоплаченные счета</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold">{stats.unpaidBills}</div>
            <p className="text-xs text-muted-foreground mt-1">
              На сумму {stats.totalAmount.toLocaleString('ru-RU')} ₽
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/meters">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">Счетчики</CardTitle>
            <Droplet className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold">{stats.metersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Зарегистрировано</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/applications">
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
            <CardTitle className="text-sm font-medium">Активные заявки</CardTitle>
            <FileText className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="text-3xl font-bold">{stats.activeApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">В обработке</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
