'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { utilityNewPassword } from '@/lib/utility-access-policy';

export default function ResetUtilityPasswordPage() {
  const [token, setToken] = useState(''), [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState(''), [repeat, setRepeat] = useState('');
  const [pending, setPending] = useState(false), [unknown, setUnknown] = useState(false), [done, setDone] = useState(false);
  const [error, setError] = useState(''), [requestId, setRequestId] = useState(''), [storageKey, setStorageKey] = useState('');
  useEffect(() => {
    const match = window.location.hash.slice(1).match(/^([a-f0-9]{64})\.(\d{1,20})$/);
    if (!match) { setError('Ссылка восстановления некорректна. Запросите новое письмо при добавлении лицевого счёта.'); return; }
    setToken(match[1]); setAccountNumber(match[2]);
    void (async () => {
      // Persist only a token digest and the idempotency id, never credentials.
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(match[1])))).map(x => x.toString(16).padStart(2, '0')).join('');
      const key = `utility-recovery:${digest}`;
      let id: string | null = null;
      try { id = sessionStorage.getItem(key); } catch { /* storage can be disabled */ }
      if (id) setUnknown(true);
      if (!id) id = crypto.randomUUID();
      setStorageKey(key); setRequestId(id);
    })();
  }, []);
  return <main className="mx-auto w-full max-w-lg px-4 py-10">
    <h1 className="mb-3 text-2xl font-semibold">Пароль лицевого счёта</h1>
    <p className="mb-5 text-sm text-slate-600">Сакский район{accountNumber && ` · № ${accountNumber}`}. Войдите в тот же личный кабинет, из которого запросили письмо. Пароль профиля сайта не изменится.</p>
    {error && <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {done ? <div role="status" className="space-y-4"><p>Пароль лицевого счёта изменён. Теперь можно добавить счёт с новым паролем.</p><Link className="text-blue-600 underline" href="/dashboard">В личный кабинет</Link></div> : <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); if (pending) return;
      if (!unknown && (!utilityNewPassword.safeParse(password).success || password !== repeat)) { setError('Укажите одинаковые пароли: 8–32 символа, латинские буквы, цифры или !@#$%&*?_-'); return; }
      setPending(true); setError('');
      try { sessionStorage.setItem(storageKey, requestId); } catch {}
      try {
        const response = await fetch('/api/accounts/password-recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: unknown ? 'check' : 'confirm', region: 'saki', accountNumber, token, requestId, ...(!unknown ? { password } : {}) }) });
        const data = await response.json();
        if (!response.ok) {
          const uncertain = data.code === 'ONE_C_RESULT_UNKNOWN' || response.status >= 500;
          setUnknown(uncertain);
          if (!uncertain) { try { sessionStorage.removeItem(storageKey); } catch {} if (data.code === 'ONE_C_REJECTED') setRequestId(crypto.randomUUID()); }
          throw new Error(data.error);
        }
        setDone(true); setPassword(''); setRepeat(''); try { sessionStorage.removeItem(storageKey); } catch {} window.history.replaceState(null, '', window.location.pathname);
      } catch (e) { if (e instanceof TypeError) setUnknown(true); setError(e instanceof Error ? e.message : 'Нет связи. Повторите проверку результата.'); }
      finally { setPending(false); }
    }}>
      {unknown ? <p className="text-sm text-slate-600">Проверим результат ранее запрошенной смены. Новый пароль повторно задавать не нужно.</p> : <>
        <div><Label htmlFor="utility-new-password">Новый пароль лицевого счёта</Label><Input id="utility-new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={32} disabled={pending} value={password} onChange={e => setPassword(e.target.value)} /></div>
        <div><Label htmlFor="utility-repeat-password">Повторите пароль</Label><Input id="utility-repeat-password" type="password" autoComplete="new-password" required disabled={pending} value={repeat} onChange={e => setRepeat(e.target.value)} /></div>
      </>}
      <Button type="submit" disabled={pending || !token || !requestId}>{pending ? 'Проверяем…' : unknown ? 'Проверить результат' : 'Подтвердить почту и сменить пароль'}</Button>
      <p><Link href="/login?callbackUrl=/dashboard" className="text-sm text-blue-600 underline">Войти в личный кабинет</Link></p>
    </form>}
  </main>;
}
