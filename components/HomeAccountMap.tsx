'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useHomeAccount } from './HomeAccountProvider';
import { GoogleAccountMap } from './GoogleAccountMap';

export function HomeAccountMap() {
  const [showMap, setShowMap] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 640px)');
    const update = () => setShowMap(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const { authenticated, userId, accounts, selectedAccount, selectedAccountId, accountData, loading, error, selectAccount, retry } = useHomeAccount();
  const address = accountData?.address?.trim() || selectedAccount?.address?.trim() || null;
  return <section aria-label="Ваши лицевые счета" className="flex h-full min-h-0 min-w-0 flex-col bg-white">
    {showMap && <div className="relative hidden min-h-0 flex-1 overflow-hidden sm:block">
      <GoogleAccountMap key={userId ?? 'guest'} address={address} />
    </div>}
    <div className="shrink-0 border-b border-slate-200 bg-white">
      {authenticated && accounts.length > 0 ? <>
        <div className="flex min-w-0 border-t border-slate-200">
          <div role="group" aria-label="Выбор лицевого счёта" className="flex min-w-0 flex-1 flex-col overflow-x-auto sm:flex-row">
            {accounts.map(account => <button key={account.id} type="button" aria-label={`№ ${account.accountNumber}`} aria-pressed={selectedAccountId === account.id}
              onClick={() => selectAccount(account.id)} title={selectedAccountId === account.id ? address || 'Адрес не указан' : account.address}
              className={`flex min-h-16 min-w-0 flex-1 flex-col items-start justify-center gap-1 border-b-2 px-3 py-2 text-left text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 sm:min-w-[176px] ${selectedAccountId === account.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
              <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold">{selectedAccountId === account.id && <Check size={13} aria-hidden />}№ {account.accountNumber}</span>
              <span className="line-clamp-2 text-[11px] font-normal leading-4 text-slate-600">{(selectedAccountId === account.id ? address : account.address) || 'Адрес не указан'}</span>
            </button>)}
          </div>
          <Link href="/dashboard/meters" className="flex w-10 shrink-0 items-center justify-center text-blue-600 hover:bg-blue-50" aria-label="Добавить лицевой счёт"><Plus size={17} /></Link>
        </div>
        {error && <p role="alert" className="px-3 py-1 text-xs text-amber-800">Данные счёта не загрузились. <button type="button" onClick={retry} className="underline">Повторить</button></p>}
      </> : <div className="flex min-h-20 flex-col items-start justify-center gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        {loading ? <p role="status">Загружаем лицевые счета…</p> : error ? <><p>Не удалось загрузить счета</p><button type="button" onClick={retry} className="text-blue-700 underline">Повторить</button></> : authenticated
          ? <><p>Добавьте лицевой счёт — здесь появится его адрес</p><Link href="/dashboard/meters" className="font-medium text-blue-700">Добавить лицевой счёт →</Link></>
          : <><p>Адрес, баланс и показания ваших счетов — в одном месте</p><Link href="/login?callbackUrl=%2F" className="font-medium text-blue-700">Войти в личный кабинет →</Link></>}
      </div>}
    </div>
  </section>;
}
