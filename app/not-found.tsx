import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardBody } from '@/components/dashboard/DashboardCard';
import { siteOutlineBtnClass, sitePageClass, sitePrimaryBtnClass } from '@/components/site/site-styles';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className={cn(sitePageClass, 'flex min-h-[60vh] items-center justify-center px-4 py-16')}>
      <DashboardCard className="w-full max-w-md">
        <DashboardCardBody className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">404</p>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Страница не найдена</h1>
          <p className="mb-6 text-sm text-slate-600">
            Запрашиваемая страница не существует или была перемещена.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className={sitePrimaryBtnClass}>
              <Link href="/">На главную</Link>
            </Button>
            <Button asChild variant="outline" className={siteOutlineBtnClass}>
              <Link href="/dashboard">Личный кабинет</Link>
            </Button>
          </div>
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
}
