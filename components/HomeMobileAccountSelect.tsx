'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useHomeAccount } from './HomeAccountProvider';

/** Compact phone control; shares selection with the map and action cards. */
export function HomeMobileAccountSelect() {
  const router = useRouter();
  const { authenticated, accounts, selectedAccountId, selectedAccount, accountData, loading, error, selectAccount, retry } = useHomeAccount();
  const address = accountData?.address?.trim() || selectedAccount?.address?.trim();

  return <div className="home-mobile-account-select">
    <div className="home-account-control">
      {accounts.length > 0 ? <>
        <select aria-label="Лицевой счёт для быстрых действий" value={selectedAccountId ?? ''}
          onChange={event => event.target.value === 'add-account' ? router.push('/dashboard/meters') : selectAccount(event.target.value)}>
          {!selectedAccountId && <option value="" disabled>Выбрать счёт</option>}
          {accounts.map(account => <option key={account.id} value={account.id}>№ {account.accountNumber}</option>)}
          <option value="add-account">Добавить лицевой счёт…</option>
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </> : loading ? <span role="status">Загрузка…</span> : error ? <button type="button" onClick={retry}>Повторить</button>
        : <Link href={authenticated ? '/dashboard/meters' : '/login?callbackUrl=%2F'}>{authenticated ? 'Добавить счёт' : 'Войти'}</Link>}
    </div>
    {selectedAccount && <p className="home-account-address" title={address || 'Адрес не указан'}>{address || 'Адрес не указан'}</p>}
    {error && accounts.length > 0 && <p className="home-account-error" role="alert">Данные не загрузились. <button type="button" onClick={retry}>Повторить</button></p>}
    <style jsx>{`
      .home-mobile-account-select { display: none; }
      @media (max-width: 639px) {
        .home-mobile-account-select { display: contents; }
        .home-account-control { position: relative; grid-column: 2; grid-row: 1; display: flex; align-items: center; justify-content: flex-end; min-width: 0; max-width: 132px; min-height: 44px; font-size: 12px; color: #2563eb; }
        .home-account-control select { appearance: none; width: 100%; min-width: 0; height: 44px; padding: 6px 22px 6px 8px; border: 1px solid #cbd5e1; border-radius: 0; background: white; font: inherit; font-weight: 600; color: #1e40af; text-overflow: ellipsis; cursor: pointer; }
        .home-account-control :global(svg) { position: absolute; right: 6px; pointer-events: none; }
        .home-account-control :global(a), .home-account-control button { display: flex; align-items: center; min-height: 44px; padding: 6px 8px; }
        .home-account-control select:focus-visible, .home-account-control :global(a:focus-visible), button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
        .home-account-address { grid-column: 1 / -1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; line-height: 16px; color: #64748b; }
        .home-account-error { grid-column: 1 / -1; font-size: 11px; line-height: 16px; color: #92400e; }
        .home-account-error button { text-decoration: underline; }
      }
    `}</style>
  </div>;
}
