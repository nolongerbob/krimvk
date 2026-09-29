'use client';
import { useId, useRef, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ONE_C_REGION_OPTIONS } from '@/lib/1c-regions';
import type { UserDetails } from './UserDetailsDialog';

export function AdminAddAccountForm({ user, disabled, onAdded, onBusyChange }: {
  user: Pick<UserDetails, 'id' | 'name' | 'email'>; disabled?: boolean;
  onAdded?: (account: UserDetails['userAccounts'][number]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [accountNumber, setAccountNumber] = useState(''), [region, setRegion] = useState(''), [password, setPassword] = useState('');
  const [error, setError] = useState(''), [success, setSuccess] = useState('');
  const submitting = useRef(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || disabled) return;
    submitting.current = true; setBusy(true); onBusyChange(true); setError(''); setSuccess('');
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/accounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountNumber: accountNumber.trim(), password1c: password, region }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось добавить счёт');
      setPassword(''); setAccountNumber(''); setRegion(''); setOpen(false);
      setSuccess(`Счёт № ${data.account.accountNumber} добавлен пользователю. Счётчики загружены.${data.emailSyncPending ? ' Подтверждённая почта профиля пока не передана в 1С.' : ''}`);
      onAdded?.(data.account);
    } catch (e) { setError(e instanceof Error ? e.message : 'Нет связи с сервером. Проверьте список счетов перед повторной попыткой.'); }
    finally { submitting.current = false; setBusy(false); onBusyChange(false); }
  }
  return <div className="space-y-3">
    {!open ? <Button type="button" variant="outline" disabled={disabled} className="gap-2" onClick={() => { setOpen(true); setError(''); setSuccess(''); }}><Plus size={16} />Добавить лицевой счёт</Button> :
      <form className="space-y-4 border border-blue-200 bg-blue-50/40 p-4" onSubmit={submit}>
        <div><h3 className="font-semibold">Добавить лицевой счёт</h3><p className="mt-1 break-words text-sm text-slate-600">Получатель: {user.name || user.email}{user.name ? ` · ${user.email}` : ''}</p></div>
        <fieldset disabled={busy || disabled} className="space-y-3">
          <div className="space-y-1"><Label htmlFor={`${fieldId}-region`}>Район</Label><select id={`${fieldId}-region`} required value={region} onChange={e => setRegion(e.target.value)} className="h-10 w-full min-w-0 border border-slate-200 bg-white px-3 text-sm"><option value="" disabled>Выберите район</option>{ONE_C_REGION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div className="space-y-1"><Label htmlFor={`${fieldId}-number`}>Номер лицевого счёта</Label><Input id={`${fieldId}-number`} required inputMode="numeric" pattern="[0-9]{1,20}" maxLength={20} value={accountNumber} onChange={e => setAccountNumber(e.target.value)} autoComplete="off" /></div>
          <div className="space-y-1"><Label htmlFor={`${fieldId}-password`}>Пароль лицевого счёта 1С</Label><Input id={`${fieldId}-password`} required type="password" maxLength={256} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></div>
        </fieldset>
        <p className="text-xs text-slate-500">Счёт добавится в кабинет выбранного пользователя после проверки в 1С. Пароль и данные абонента не изменяются. Для Сакского района синхронизируется подтверждённая почта профиля.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy || disabled || !region || !accountNumber.trim() || !password.trim()} className="gap-2">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? 'Проверяем и добавляем…' : 'Добавить пользователю'}</Button><Button type="button" variant="outline" disabled={busy || disabled} onClick={() => { setOpen(false); setPassword(''); setError(''); }}>Отмена</Button></div>
      </form>}
    {success && <p role="status" className="border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</p>}
  </div>;
}
