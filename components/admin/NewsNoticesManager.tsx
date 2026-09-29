"use client";
import { useCallback, useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { dateToMoscowInput } from '@/lib/site-notices';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { adminContainerClass } from '@/components/admin/admin-styles';
type News = { id: string; title: string; published: boolean };
type Notice = { id: string; text: string; buttonLabel: string; newsId: string; startsAt: string; endsAt: string; enabled: boolean; news: Pick<News, 'title' | 'published'> };
type Form = { id?: string; text: string; buttonLabel: string; newsId: string; startsAt: string; endsAt: string; enabled: boolean };
const blank = (): Form => ({ text: '', buttonLabel: 'Что изменится', newsId: '', startsAt: dateToMoscowInput(new Date()), endsAt: dateToMoscowInput(new Date(Date.now() + 7 * 86400000)), enabled: false });
const field = 'mt-2 block w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-blue-600';
export function NewsNoticesManager() {
  const [notices, setNotices] = useState<Notice[]>([]), [news, setNews] = useState<News[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/news/notices', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка загрузки');
    setNotices(data.notices); setNews(data.news);
  }, []);
  useEffect(() => {
    void load().catch(e => setError(e.message)).finally(() => setLoading(false));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [load]);
  function edit(item: Notice) {
    setForm({ id: item.id, text: item.text, buttonLabel: item.buttonLabel, newsId: item.newsId, enabled: item.enabled, startsAt: dateToMoscowInput(item.startsAt), endsAt: dateToMoscowInput(item.endsAt) });
    setError(''); setMessage('');
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/news/notices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка сохранения');
      setForm(current => ({ ...current, id: data.notice.id }));
      await load(); setMessage('Сохранено. Полоса обновится при переходе на страницу или в течение 30 секунд.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка сохранения'); }
    finally { setSaving(false); }
  }
  function status(item: Notice) {
    if (!item.enabled) return 'Выключено';
    if (!item.news.published) return 'Не показывается: новость в черновиках';
    if (Date.parse(item.endsAt) <= now) return 'Показ завершён';
    if (Date.parse(item.startsAt) > now) return 'Запланировано';
    return 'В периоде показа';
  }
  return <div className={adminContainerClass}>
    <Link href="/admin/news" className="mb-4 inline-block text-sm text-blue-700">← Управление новостями</Link>
    <AdminPageHeader title="Важные уведомления" description="Полоса на главной и в личном кабинете. Все даты — московское время (UTC+3). Пока только DEV." />
    <p className="mb-6 text-sm text-slate-600">При пересечении периодов показывается уведомление с более поздним началом. Черновики новостей не показываются. После окончания срока полоса исчезает автоматически.</p>
    {error && <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mb-4 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {loading ? <p>Загрузка уведомлений…</p> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <form onSubmit={save} className="space-y-5 border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{form.id ? 'Редактирование уведомления' : 'Новое уведомление'}</h2>
        <fieldset disabled={saving} className="space-y-5 disabled:opacity-60">
          <label className="block text-sm font-medium">Текст полосы<textarea required maxLength={200} rows={2} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} className={field} placeholder="С 1 октября изменятся тарифы на воду и водоотведение." /></label>
          <label className="block text-sm font-medium">Связанная новость<select required value={form.newsId} onChange={e => setForm({ ...form, newsId: e.target.value })} className={field}><option value="">Выберите новость</option>{news.map(item => <option key={item.id} value={item.id}>{item.title}{!item.published ? ' — черновик' : ''}</option>)}</select></label>
          <Link className="block text-sm text-blue-700 underline" href="/admin/news/create">Создать новость</Link>
          <label className="block text-sm font-medium">Текст кнопки<input required maxLength={40} value={form.buttonLabel} onChange={e => setForm({ ...form, buttonLabel: e.target.value })} className={field} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Показывать с (МСК)<input required type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} className={field} /></label>
            <label className="block text-sm font-medium">Показывать до (МСК)<input required type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} className={field} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />Включить показ по расписанию</label>
          <div className="border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700"><span className="mb-1 block text-xs text-blue-700">ПРЕДПРОСМОТР</span>{form.text || 'Текст уведомления'} <span className="ml-2 font-medium text-blue-700">{form.buttonLabel || 'Что изменится'} →</span></div>
          <button type="submit" className="bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{saving ? 'Сохранение…' : 'Сохранить уведомление'}</button>
        </fieldset>
      </form>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Все уведомления</h2><button type="button" disabled={saving} onClick={() => { setForm(blank()); setError(''); setMessage(''); }} className="text-sm text-blue-700">+ Новое</button></div>
        {!notices.length && <p className="border border-dashed border-slate-200 p-5 text-sm text-slate-500">Уведомлений пока нет. Создайте первое слева.</p>}
        {notices.map(item => <article key={item.id} className="border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-blue-700">{status(item)}</span>
          <p className="my-2 break-words text-sm font-medium">{item.text}</p>
          <p className="text-xs text-slate-500">{new Date(item.startsAt).toLocaleString('ru-RU', {timeZone:'Europe/Moscow'})} — {new Date(item.endsAt).toLocaleString('ru-RU', {timeZone:'Europe/Moscow'})} МСК</p>
          <p className="mt-2 text-xs text-slate-500">Новость: {item.news.title}</p>
          <button type="button" disabled={saving} onClick={() => edit(item)} className="mt-3 text-sm text-blue-700 underline">Редактировать</button>
        </article>)}
      </section>
    </div>}
  </div>;
}
