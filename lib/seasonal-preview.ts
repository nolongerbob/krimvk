import { seasonalEnabled } from '@/lib/release-features';
export const SEASONAL_PREVIEW_KEY = 'krimvk:dev:autumn:v1';
export const SEASONAL_PREVIEW_EVENT = 'krimvk:dev:autumn-change';

export function shouldShowSeasonalPet(path: string | null): boolean {
  return path !== null && path !== '/admin/questions' && !path.startsWith('/admin/questions/');
}

export function shouldShowSeasonalEffects(path: string | null): boolean {
  return path === '/' || path === '/dashboard' || !!path?.startsWith('/dashboard/');
}

export function readSeasonalPreview(): boolean {
  if (!seasonalEnabled()) return false;
  try { return localStorage.getItem(SEASONAL_PREVIEW_KEY) === 'on' || (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_HOME_VISUAL_PREVIEW === 'true'); }
  catch { return false; }
}

export function setSeasonalPreview(enabled: boolean): void {
  if (!seasonalEnabled()) return;
  localStorage.setItem(SEASONAL_PREVIEW_KEY, enabled ? 'on' : 'off');
  window.dispatchEvent(new Event(SEASONAL_PREVIEW_EVENT));
}
