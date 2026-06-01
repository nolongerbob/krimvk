import { requireAdminPage } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return <>{children}</>;
}
