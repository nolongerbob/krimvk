'use client';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

const providers = [
  { id: 'yandex', name: 'Яндекс', icon: 'yandex.svg' },
  { id: 'vk', name: 'VK ID', icon: 'vk.svg' },
  { id: 'ok_ru', name: 'Одноклассники', icon: 'ok.svg' },
  { id: 'mail_ru', name: 'Mail.ru', icon: 'mail.svg' },
  { id: 'gosuslugi', name: 'Госуслуги', icon: 'gosuslugi-mark.svg' },
];
type Service = { id: string; linked: boolean; available: boolean };

export function YandexLink() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [password, setPassword] = useState('');
  const [opened, setOpened] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(false);
  const params = useSearchParams();
  useEffect(() => {
    setLocal(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch('/api/auth/linked-services', { cache: 'no-store', signal: controller.signal });
        if (response.status === 404) { setHidden(true); return; }
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (controller.signal.aborted) return;
        setServices(data.services); setLoadError(false);
        setOpened(current => data.services.some((s: Service) => s.id === current && s.linked) ? null : current);
      } catch { if (!controller.signal.aborted) setLoadError(true); }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, []);
  if (hidden) return null;
  return <section id="gosuslugi" className="mt-6 border border-slate-200 bg-white">
    <header className="px-5 py-5 sm:px-6">
      <h2 className="text-lg font-semibold text-slate-900">Вход через сервисы</h2>
      <p className="mt-1 text-sm text-slate-500">Привяжите аккаунт для быстрого входа без пароля КрымВК.</p>
      <p className="mt-1 text-xs text-slate-500">VK, Одноклассники и Mail.ru используют общую привязку VK ID.</p>
      {local && <a href="https://dev.krimvk.ru/dashboard/settings" className="mt-3 block text-sm text-blue-700 underline">Для проверки привязки откройте защищённый HTTPS dev</a>}
    </header>
    {loadError ? <p role="alert" className="px-6 pb-5 text-sm text-red-700">Не удалось проверить привязки. Обновите страницу.</p> : !services ?
      <p role="status" className="px-6 pb-5 text-sm text-slate-500">Проверяем привязки…</p> :
      <div className="divide-y divide-slate-100 border-t border-slate-100">
        {providers.map(provider => {
          const state = services.find(s => s.id === provider.id);
          return <div key={provider.id} id={provider.id === 'yandex' ? 'yandex' : undefined} className="px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-slate-50">
                <img src={'/images/auth-providers/' + provider.icon} width={26} height={26} alt="" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{provider.name}</p>
                <p className={'mt-0.5 text-xs ' + (state?.linked ? 'text-green-700' : 'text-slate-500')}>
                  {state?.linked ? '✓ Привязан' : 'Не привязан'}
                </p>
              </div>
              {state?.linked ? <span className="text-xs text-slate-500">{state.available ? 'Вход доступен' : 'Вход пока недоступен'}</span> :
                <button type="button" disabled={!state?.available || busy} onClick={() => { if (local) { window.location.assign('https://dev.krimvk.ru/dashboard/settings'); return; } setOpened(opened === provider.id ? null : provider.id); setPassword(''); setError(''); }}
                  className="min-h-10 shrink-0 border border-slate-200 px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400">
                  {!state?.available ? 'Скоро' : opened === provider.id ? 'Отмена' : 'Привязать'}
                </button>}
            </div>
            {opened === provider.id && !state?.linked && <form onSubmit={async e => {
              e.preventDefault(); setBusy(true); setError('');
              try {
                const service = provider.id === 'vk' ? 'vkid' : provider.id;
                const response = await fetch(provider.id === 'yandex' ? '/api/auth/yandex-link' : '/api/auth/vk-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, service, mode: 'link' }) });
                setPassword('');
                if (!response.ok) throw new Error();
                if (provider.id === 'yandex') await signIn('yandex', { callbackUrl: '/dashboard/settings#yandex' });
                else {
                  const data = await response.json();
                  const url = new URL(data.url);
                  if (url.origin !== 'https://id.vk.ru') throw new Error();
                  window.location.assign(url.toString());
                }
              } catch {
                setPassword(''); setError('Не удалось подтвердить привязку. Проверьте пароль и повторите.'); setBusy(false);
              }
            }} className="mt-4 border-t border-slate-100 pt-4">
              <label htmlFor="yandex-link-password" className="mb-2 block text-sm text-slate-600">Подтвердите текущий пароль КрымВК</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id="yandex-link-password" type="password" autoComplete="current-password" required maxLength={256} disabled={busy} value={password} onChange={e => setPassword(e.target.value)} className="h-11 min-w-0 flex-1 rounded-none border border-slate-300 px-3 focus:outline-blue-600" />
                <button disabled={busy} type="submit" className="min-h-11 bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Переходим…' : 'Продолжить'}</button>
              </div>
              {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
            </form>}
          </div>;
        })}
      </div>}
    {params.get('yandex') === 'conflict' && <p role="alert" className="px-6 pb-4 text-sm text-red-700">Подтверждение истекло или этот Яндекс уже связан с другим кабинетом. Повторите привязку.</p>}
    {['conflict', 'failed', 'cancelled'].includes(params.get('vk') || '') && <p role="alert" className="px-6 pb-4 text-sm text-red-700">{params.get('vk') === 'conflict' ? 'Этот VK ID уже привязан к другому кабинету, либо у вас уже привязан другой VK ID.' : params.get('vk') === 'cancelled' ? 'Привязка отменена. Данные не изменены.' : 'Не удалось завершить привязку. Попробуйте ещё раз.'}</p>}
  </section>;
}
