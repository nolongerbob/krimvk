'use client';

import { useEffect, useState } from 'react';
import { readSeasonalPreview, setSeasonalPreview, SEASONAL_PREVIEW_EVENT } from '@/lib/seasonal-preview';

export function SeasonalPreviewSettings() {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const sync = () => setEnabled(readSeasonalPreview());
    sync();
    window.addEventListener(SEASONAL_PREVIEW_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(SEASONAL_PREVIEW_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  return <section data-seasonal-surface className="rounded-2xl border bg-white p-6 text-slate-900">
    <h1 className="text-2xl font-semibold">Настройки сайта · DEV</h1>
    <p className="my-4 text-slate-600">Осеннее оформление только в этом браузере на локальном сайте. Общие настройки и база не изменяются.</p>
    <label className="flex min-h-11 items-center gap-3">
      <input type="checkbox" checked={enabled} onChange={e => {
        try { setSeasonalPreview(e.target.checked); setError(''); }
        catch { setError('Браузер запретил сохранение настройки.'); }
      }} className="h-5 w-5" /> Осенний режим
    </label>
    <p role="status" className="mt-2 font-medium">{enabled ? 'Осенний режим включён' : 'Режим выключен — включите переключатель выше, чтобы появилась капелька.'}</p>
    <p className="mt-3 text-sm text-slate-600">При уменьшении движения в системе, включении BVI или открытом диалоге анимация отключается. Помощник пока без ИИ.</p>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
  </section>;
}
