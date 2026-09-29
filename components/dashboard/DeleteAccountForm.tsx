'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DeleteAccountForm({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <section className="mt-8 border-t border-red-200 pt-6">
    <h2 className="text-lg font-semibold text-slate-900">Удаление аккаунта</h2>
    {isAdmin ? <p className="mt-2 text-sm text-slate-600">Удаление служебного аккаунта выполняется через другого администратора, чтобы не потерять доступ и материалы сайта.</p> : <>
      <p className="mt-2 mb-4 text-sm text-slate-600">Удалить аккаунт и все его привязки лицевых счетов на сайте. Сами лицевые счета в 1С и обязательства по оплате сохранятся.</p>
      {!open ? <Button type="button" variant="outline" className="border-red-200 text-red-700" onClick={() => setOpen(true)}>Удалить аккаунт</Button> :
        <form className="max-w-md space-y-4 border border-red-200 bg-red-50 p-4" onSubmit={async event => {
          event.preventDefault(); if (busy) return;
          setBusy(true); setError('');
          try {
            const response = await fetch('/api/user/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, confirmation }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Не удалось удалить аккаунт');
          } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка соединения'); setBusy(false); return; }
          // Deletion already succeeded: logout failure must not invite another delete.
          try { await signOut({ redirect: false }); } finally { window.location.replace('/'); }
        }}>
          <p className="text-sm text-red-900">Действие необратимо. Будут удалены профиль, связи с сервисами входа, привязки лицевых счетов и история этого кабинета: показания, счета, заявки и переписка. Это не удаляет данные в 1С. Договоры и сообщения об авариях у организации сохраняются.</p>
          <div className="space-y-1"><Label htmlFor="delete-account-password">Пароль от аккаунта</Label><Input id="delete-account-password" type="password" autoComplete="current-password" required maxLength={256} value={password} disabled={busy} onChange={e => setPassword(e.target.value)} /></div>
          <Link className="block text-sm text-blue-700 underline" href="/forgot-password">Не помню пароль или входил через сервис</Link>
          <div className="space-y-1"><Label htmlFor="delete-account-confirmation">Введите УДАЛИТЬ</Label><Input id="delete-account-confirmation" autoComplete="off" required value={confirmation} disabled={busy} onChange={e => setConfirmation(e.target.value)} /></div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-2"><Button type="submit" variant="destructive" disabled={busy || confirmation !== 'УДАЛИТЬ' || !password}>{busy ? 'Удаляем…' : 'Удалить безвозвратно'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setOpen(false); setPassword(''); setConfirmation(''); setError(''); }}>Отмена</Button></div>
        </form>}
    </>}
  </section>;
}
