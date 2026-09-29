'use client';
import { useEffect, useState } from 'react';
import { UnlinkAccountButton } from './UnlinkAccountButton';
import Link from 'next/link';

type Account = { id: string; accountNumber: string; address: string };
export function LinkedUtilityAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetch('/api/accounts', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Не удалось загрузить лицевые счета');
      const data = await response.json();
      if (!controller.signal.aborted) { setAccounts(data.accounts); setLoaded(true); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [attempt]);
  return <section className="space-y-4 border border-slate-200 bg-white p-6">
    <h2 className="text-xl font-semibold">Привязанные лицевые счета</h2>
    <p className="text-sm text-slate-500">Управляйте доступом к своим лицевым счетам.</p>
    {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
    {error ? <p role="alert">{error}. <button type="button" className="underline" onClick={() => setAttempt(x => x + 1)}>Повторить</button></p>
      : !loaded ? <p role="status">Загрузка…</p>
      : !accounts.length ? <p className="text-sm text-slate-500">Нет привязанных лицевых счетов. <Link className="text-blue-600 underline" href="/dashboard">Добавить счёт в личном кабинете</Link></p>
      : accounts.map(account => <div key={account.id} className="space-y-3 border-t border-slate-100 pt-4">
        <div><p className="font-medium">Лицевой счёт №{account.accountNumber}</p><p className="text-sm text-slate-500">{account.address}</p></div>
        <UnlinkAccountButton account={account} onUnlinked={() => { setAccounts(rows => rows.filter(row => row.id !== account.id)); setNotice(`Счёт №${account.accountNumber} отвязан`); }} />
      </div>)}
  </section>;
}
