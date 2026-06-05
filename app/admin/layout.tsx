import { requireAdminPage } from '@/lib/require-admin';
import { cn } from '@/lib/utils';
import { dashboardPageClass } from '@/components/dashboard/dashboard-styles';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return (
    <div
      className={cn(
        dashboardPageClass,
        '[&_button]:!rounded-none [&_input]:!rounded-none [&_select]:!rounded-none'
      )}
    >
      {children}
    </div>
  );
}
