'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ConfirmEmailChangePage() {
  const { status, update } = useSession();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setToken(window.location.hash.slice(1)); }, []);
  return <main className="mx-auto max-w-xl space-y-5 px-5 py-16">
    <h1 className="text-2xl font-semibold">Подтверждение смены email</h1>
    <p>Подтвердите смену адреса для входа в личный кабинет. Лицевые счета и их данные останутся без изменений.</p>
    {status === 'unauthenticated' ? <p>Сначала <Link className="text-blue-600 underline" href={`/login?callbackUrl=${encodeURIComponent('/confirm-email-change#' + token)}`}>войдите в тот же кабинет с прежним email</Link>.</p> :
      <Button disabled={status !== 'authenticated' || busy || done || !/^[a-f0-9]{64}$/.test(token)} onClick={async () => {
        setBusy(true);
        setMessage('');
        try {
          const response = await fetch('/api/auth/change-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'confirm', token }) });
          const data = await response.json();
          if (!response.ok) { setMessage(data.error || 'Не удалось подтвердить email'); return; }
          setDone(true);
          setMessage(data.message);
          window.history.replaceState(null, '', '/confirm-email-change');
          try { await update(); } catch { setMessage('Email изменён. Обновите страницу, чтобы обновить данные профиля.'); }
        } catch { setMessage('Не удалось получить ответ сервера. Проверьте email в настройках перед повторной попыткой.'); }
        finally { setBusy(false); }
      }}>{done ? 'Email подтверждён' : busy ? 'Сохраняем…' : 'Подтвердить смену email'}</Button>}
    {message && <p role="status">{message}</p>}
    <p><Link className="text-blue-600 underline" href="/dashboard/settings">Вернуться в настройки</Link></p>
  </main>;
}
