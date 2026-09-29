import { notFound } from 'next/navigation';
import { isYandexAuthEnabled } from '@/lib/yandex-auth';
import { YandexLoginStart } from '@/components/auth/YandexLoginStart';

export const dynamic = 'force-dynamic';

export default function YandexLoginPage() {
  if (!isYandexAuthEnabled()) notFound();
  return <YandexLoginStart />;
}
