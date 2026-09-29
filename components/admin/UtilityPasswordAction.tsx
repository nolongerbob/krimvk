'use client';
import { useEffect, useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type SentMessage = { id: string; text: string; imageUrl: string | null; isFromAdmin: boolean; isSensitive?: boolean; createdAt: Date };
export function UtilityPasswordAction({ questionId, recipient, disabled, closed, onSent }: { questionId: string; recipient: string; disabled?: boolean; closed?: boolean; onSent: (message: SentMessage) => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [accountNumber, setAccountNumber] = useState(''), [password, setPassword] = useState(''), [manual, setManual] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [operation, setOperation] = useState<{ id: string; accountNumber: string; action: 'generate' | 'set' } | null>(null);
  const storageKey = `utility-password-operation:${questionId}`;
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch('/api/admin/utility-access', { signal: controller.signal, cache: 'no-store' }).then(async r => {
      if (!r.ok) throw new Error('Не удалось проверить доступ');
      const data = await r.json(); if (!controller.signal.aborted) setEnabled(data.writesEnabled === true);
    }).catch(() => { if (!controller.signal.aborted) { setEnabled(false); setError('Не удалось проверить доступ к 1С. Откройте окно ещё раз.'); } });
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) { const parsed = JSON.parse(saved); if (typeof parsed.id === 'string' && /^\d{1,20}$/.test(parsed.accountNumber)) { setOperation(parsed); setAccountNumber(parsed.accountNumber); } }
    } catch { /* no storage */ }
    return () => controller.abort();
  }, [open, storageKey]);

  async function submit(syncOnly = false) {
    if (busy || !enabled || closed) return;
    setBusy(true); setError(''); setNotice('');
    const op = operation || { id: crypto.randomUUID(), accountNumber: accountNumber.trim(), action: manual ? 'set' as const : 'generate' as const };
    if (!syncOnly) {
      setOperation(op);
      try { sessionStorage.setItem(storageKey, JSON.stringify(op)); } catch {}
    }
    try {
      const response = await fetch('/api/admin/utility-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        questionId, accountNumber: syncOnly ? accountNumber.trim() : op.accountNumber, region: 'saki', action: syncOnly ? 'sync-email' : operation ? 'check' : op.action,
        ...(!syncOnly ? { requestId: op.id, ...(!operation && op.action === 'set' ? { password } : {}) } : {}),
      }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'OPERATION_NOT_FOUND' || data.code === 'ONE_C_REJECTED' || (response.status < 500 && data.code !== 'ONE_C_RESULT_UNKNOWN' && !operation)) { setOperation(null); try { sessionStorage.removeItem(storageKey); } catch {} }
        throw new Error(data.error || 'Не удалось выполнить запрос');
      }
      if (syncOnly) setNotice('Подтверждённая почта профиля передана в 1С.');
      else {
        if (data.message) onSent(data.message);
        setOperation(null); setPassword(''); try { sessionStorage.removeItem(storageKey); } catch {}
        setNotice('Новый пароль установлен в 1С и отправлен в этот чат.' + (data.emailWarning ? ` ${data.emailWarning}` : ''));
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Нет связи. Повторите проверку результата.'); }
    finally { setBusy(false); }
  }

  return <>
    <Button type="button" variant="outline" size="sm" className="gap-2 rounded-none border-slate-200" disabled={disabled} onClick={() => setOpen(true)}><KeyRound size={16} />Пароль 1С</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Пароль лицевого счёта</DialogTitle><DialogDescription>Только Сакский район. Новый пароль будет отправлен в чат: {recipient}.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); void submit(); }}>
          <div><Label htmlFor="operator-account-number">Лицевой счёт</Label><Input id="operator-account-number" inputMode="numeric" pattern="[0-9]{1,20}" required maxLength={20} value={accountNumber} disabled={busy || Boolean(operation)} onChange={e => { setAccountNumber(e.target.value); setNotice(''); setError(''); }} placeholder="Например: 517013" /></div>
          <p className="text-xs text-slate-500">Проверьте получателя и номер счёта. Текущий пароль перестанет работать. Генерация — 8 символов: латинские буквы и цифры.</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={manual} disabled={busy || Boolean(operation)} onChange={e => setManual(e.target.checked)} />Задать пароль вручную</label>
          {manual && !operation && <div><Label htmlFor="operator-new-password">Новый пароль</Label><Input id="operator-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={32} required value={password} disabled={busy} onChange={e => setPassword(e.target.value)} /></div>}
          {enabled === false && <p className="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Изменение паролей и почты в 1С отключено на сервере. Администратору нужно проверить защищённое подключение и разрешение этих операций. Данные абонентов не изменяются.</p>}
          {closed && <p className="text-sm text-amber-800">Диалог завершён. Перед отправкой пароля верните его в работу.</p>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
          <Button type="submit" className="w-full gap-2" disabled={busy || !enabled || closed || !accountNumber.trim()}>{busy && <Loader2 size={16} className="animate-spin" />}{operation ? 'Проверить результат' : manual ? 'Установить и отправить в чат' : 'Сгенерировать и отправить'}</Button>
          <Button type="button" variant="outline" className="w-full" disabled={busy || !enabled || closed || !accountNumber.trim() || Boolean(operation)} onClick={() => void submit(true)}>Передать почту профиля в 1С</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
