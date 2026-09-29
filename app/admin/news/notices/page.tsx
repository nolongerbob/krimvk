import { noticesEnabled } from '@/lib/release-features';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/require-admin';
import { NewsNoticesManager } from '@/components/admin/NewsNoticesManager';
export default async function NewsNoticesPage() {
  if (!noticesEnabled()) notFound();
  await requireAdminPage('/admin/news/notices');
  return <NewsNoticesManager />;
}
