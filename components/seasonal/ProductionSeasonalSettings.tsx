'use client';
import { useEffect, useState } from 'react';
export function ProductionSeasonalSettings() {
  const [settings, setSettings] = useState({ mascotEnabled: false, autumnEnabled: false });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let alive = true;
    fetch('/api/admin/site-settings', { cache: 'no-store' }).then(async r => {
      if (!r.ok) throw new Error();
      const data = await r.json();
      if (alive) { setSettings(data); setLoaded(true); }
    }).catch(() => { if (alive) setMessage('Не удалось загрузить настройки. Обновите страницу.'); });
    return () => { alive = false; };
  }, []);
  async function save() {
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/admin/site-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось сохранить');
      setMessage('Сохранено. Изменения появятся у посетителей в течение 30 секунд.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Не удалось сохранить'); }
    finally { setBusy(false); }
  }
  return <section className="rounded-2xl border bg-white p-6">
    <h1 className="text-2xl font-semibold">Настройки сайта</h1>
    <p className="my-4 text-slate-600">Общие настройки для всех посетителей. По умолчанию эффекты выключены.</p>
    <fieldset disabled={!loaded || busy} className="space-y-4">
      <label className="flex gap-3"><input type="checkbox" checked={settings.mascotEnabled} onChange={e => setSettings(s => ({ ...s, mascotEnabled: e.target.checked }))} />Капелька-помощник</label>
      <label className="flex gap-3"><input type="checkbox" checked={settings.autumnEnabled} onChange={e => setSettings(s => ({ ...s, autumnEnabled: e.target.checked }))} />Осенние листья</label>
      <button type="button" onClick={save} className="rounded bg-blue-600 px-4 py-2 text-white">{busy ? 'Сохранение…' : 'Сохранить'}</button>
    </fieldset>
    <p role="status" className="mt-4">{message}</p>
  </section>;
}
