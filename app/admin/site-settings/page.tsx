import { seasonalEnabled } from '@/lib/release-features';
import { notFound } from 'next/navigation';
import { SeasonalPreviewSettings } from '@/components/seasonal/SeasonalPreviewSettings';
import { ProductionSeasonalSettings } from '@/components/seasonal/ProductionSeasonalSettings';

export default function SiteSettingsPage() {
  if (!seasonalEnabled()) notFound();
  return <div className="mx-auto w-full max-w-5xl p-6">{process.env.NODE_ENV === 'production' ? <ProductionSeasonalSettings /> : <SeasonalPreviewSettings />}</div>;
}
