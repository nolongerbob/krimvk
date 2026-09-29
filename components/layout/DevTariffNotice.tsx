"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NoticeText } from './NoticeText';
import { ArrowUpRight, Info, Pause, Play, X } from 'lucide-react';
type Notice = { id: string; text: string; buttonLabel: string; newsId: string; endsAt: string; updatedAt: string };
export function DevTariffNotice() {
  const pathname = usePathname();
  const visible = pathname === '/' || pathname === '/dashboard' || !!pathname?.startsWith('/dashboard/');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dismissed, setDismissed] = useState('');
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!visible) { setNotice(null); return; }
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_HOME_VISUAL_PREVIEW === 'true') {
      setNotice({ id: 'dev-preview', text: 'Тестовое уведомление: со следующего месяца изменятся тарифы на водоснабжение.', buttonLabel: 'К новостям', newsId: '', endsAt: '2099-01-01', updatedAt: 'preview' });
      return;
    }
    let alive = true, busy = false;
    let expiry: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function refresh() {
      if (busy) return;
      busy = true;
      try {
        const started = performance.now();
        const response = await fetch('/api/news/notices', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Unavailable');
        const data = await response.json();
        if (!alive) return;
        clearTimeout(expiry);
        const remaining = data.notice ? Date.parse(data.notice.endsAt) - Date.parse(data.serverNow) - (performance.now() - started) : 0;
        setNotice(remaining > 0 ? data.notice : null);
        if (remaining > 0) expiry = setTimeout(() => { setNotice(null); void refresh(); }, Math.min(remaining, 2147483647));
      } catch { if (alive) setNotice(null); }
      finally { busy = false; }
    }
    void refresh();
    const interval = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { alive = false; controller.abort(); clearInterval(interval); clearTimeout(expiry); window.removeEventListener('focus', refresh); };
  }, [visible, pathname]);
  if (!visible || !notice) return null;
  const version = `${notice.id}:${notice.updatedAt}`;
  if (dismissed === version) return <div className="border-b border-slate-100 bg-white"><div className="mx-auto flex max-w-7xl justify-end px-4 sm:px-6 lg:px-8"><button type="button" onClick={() => setDismissed('')} className="py-2 text-xs text-slate-600 underline underline-offset-4">Важное уведомление</button></div></div>;
  return <section aria-label="Важное уведомление" className="notice-row border-b border-blue-100 bg-blue-50 text-slate-800">
    <div className="notice-general">
    <div className="notice-mobile">
      <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-600" />
      <Link href={`/news/${encodeURIComponent(notice.newsId)}`} className="notice-ticker" aria-label={`${notice.text} ${notice.buttonLabel}`}>
        <span className="notice-track" style={{ animationDuration: `${Math.max(18, notice.text.length * .22)}s`, animationPlayState: paused ? 'paused' : undefined }}>
          <span>{notice.text} <strong>{notice.buttonLabel} ↗</strong></span>
          <span aria-hidden="true">{notice.text} <strong>{notice.buttonLabel} ↗</strong></span>
        </span>
      </Link>
      <button type="button" className="notice-pause" aria-label={paused ? 'Продолжить бегущую строку' : 'Приостановить бегущую строку'} onClick={() => setPaused(value => !value)}>
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      </button>
      <button type="button" className="notice-close" aria-label="Свернуть уведомление" onClick={() => setDismissed(version)}><X size={16} aria-hidden="true" /></button>
    </div>
    <div className="hidden h-12 w-full items-center gap-3 px-4 sm:flex sm:px-6">
      <Info aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-blue-600 sm:mt-0" />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <NoticeText text={notice.text} />
        <Link href={`/news/${encodeURIComponent(notice.newsId)}`} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium leading-6 text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">{notice.buttonLabel}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
      </div>
      <button type="button" aria-label="Свернуть уведомление" onClick={() => setDismissed(version)} className="-my-1 flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><X aria-hidden="true" className="h-4 w-4" /></button>
    </div>
    </div>
    <style jsx>{`
      .notice-general { min-width: 0; }
      .notice-mobile { display: flex; align-items: center; gap: 8px; min-height: 36px; padding-left: 12px; }
      .notice-mobile :global(.notice-ticker) { display: flex; align-items: center; flex: 1; min-width: 0; height: 36px; overflow: hidden; font-size: 13px; }
      .notice-track { display: flex; width: max-content; flex-shrink: 0; animation: notice-scroll linear infinite; }
      .notice-track > span { flex-shrink: 0; white-space: nowrap; padding-right: 40px; }
      .notice-track strong { margin-left: 12px; font-weight: 500; color: #1d4ed8; }
      .notice-mobile :global(.notice-ticker:focus) .notice-track { animation-play-state: paused; }
      @media (hover: hover) { .notice-mobile :global(.notice-ticker:hover) .notice-track { animation-play-state: paused; } }
      .notice-pause, .notice-close { display: flex; align-items: center; justify-content: center; width: 32px; height: 36px; flex-shrink: 0; color: #475569; }
      .notice-mobile button:focus-visible, .notice-mobile :global(a:focus-visible) { outline: 2px solid #2563eb; outline-offset: -2px; }
      @keyframes notice-scroll { to { transform: translateX(-50%); } }
      @media (min-width: 640px) { .notice-mobile { display: none; } }
      @media (prefers-reduced-motion: reduce) {
        .notice-mobile :global(.notice-ticker) { height: auto; min-height: 36px; padding: 8px 0; }
        .notice-track { animation: none; width: 100%; }
        .notice-track > span { flex-shrink: 1; white-space: normal; padding-right: 0; }
        .notice-track > span[aria-hidden="true"], .notice-pause { display: none; }
      }
    `}</style>
  </section>;
}
