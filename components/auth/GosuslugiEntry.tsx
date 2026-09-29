'use client';
import { useEffect, useState } from 'react';
import { getProviders } from 'next-auth/react';

const providers = [
  { id: 'gosuslugi', name: 'Госуслуги', icon: 'gosuslugi-mark.svg', size: 28 },
  { id: 'yandex', name: 'Яндекс', icon: 'yandex.svg', size: 26 },
  { id: 'vk', name: 'VK', icon: 'vk.svg', size: 26 },
  { id: 'ok_ru', name: 'Одноклассники', icon: 'ok.svg', size: 28 },
  { id: 'mail_ru', name: 'Mail.ru', icon: 'mail.svg', size: 28 },
] as const;

/** Dev entry points: Yandex login and previews of other providers. */
export function GosuslugiEntry({ settings = false }: { settings?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [opened, setOpened] = useState(false);
  const [yandexReady, setYandexReady] = useState(false);
  useEffect(() => {
    let active = true;
    void getProviders().then(data => { if (active) setYandexReady(!!data?.yandex); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/esia-preview', { cache: 'no-store', signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setEnabled(data?.preview === true); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!enabled) return null;
  return <section id={settings ? 'gosuslugi' : undefined} className={settings ? 'mt-6 border border-slate-200 bg-white p-6' : 'mt-6'}>
    {settings ? <>
      <h2 className="text-lg font-semibold text-slate-900">Вход через Госуслуги</h2>
      <p className="mb-4 mt-2 text-sm text-slate-600">Привяжите Госуслуги к этому кабинету, чтобы входить без пароля КрымВК. Ваши лицевые счета и история останутся в этом кабинете.</p>
    </> : <div className="mb-4 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-200" />Войти с помощью<span className="h-px flex-1 bg-slate-200" /></div>}
    {settings ? <button type="button" onClick={() => setOpened(true)} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-none border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50">
      <img src="/images/auth-providers/gosuslugi-mark.svg" width={24} height={24} alt="" />Привязать Госуслуги
    </button> : <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Другие способы входа">
      {providers.map(provider =>
        provider.id === 'vk' || provider.id === 'ok_ru' || provider.id === 'mail_ru' || (provider.id === 'yandex' && yandexReady) ?
        <a key={provider.id} href={provider.id === 'yandex' ? '/login/yandex' : `https://dev.krimvk.ru/login/vk?service=${provider.id === 'vk' ? 'vkid' : provider.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Войти через ${provider.name} — в новой вкладке`} aria-describedby="social-preview-note" title={`Войти через ${provider.name} — в новой вкладке`} className="flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          <img src={`/images/auth-providers/${provider.icon}`} width={provider.size} height={provider.size} className="object-contain" alt="" />
        </a> :
        <button key={provider.id} type="button" disabled aria-label={`Войти через ${provider.name}`} aria-describedby="social-preview-note" title={`${provider.name} — вход пока недоступен`} className="flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          <img src={`/images/auth-providers/${provider.icon}`} width={provider.size} height={provider.size} className="object-contain" alt="" />
        </button>
      )}
    </div>}
    <p id="social-preview-note" className="sr-only">Вход через сервисы в новой вкладке. VK ID тестируется на dev.krimvk.ru. Госуслуги в подготовке.</p>
    {settings && opened && <div role="status" className="mt-4 rounded-none border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
      <p className="mb-2 text-xs text-slate-500">Тестирование на dev</p>
        <p className="font-semibold text-slate-900">Подготовка привязки</p>
        <p>После подключения ЕСИА здесь потребуется подтвердить текущий вход и перейти на Госуслуги. Сейчас привязка не выполняется, данные не меняются.</p>
      <button type="button" className="mt-3 block text-slate-600 underline" onClick={() => setOpened(false)}>Закрыть</button>
    </div>}
  </section>;
}
