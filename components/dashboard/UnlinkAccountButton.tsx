'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Unlink } from 'lucide-react';

export function UnlinkAccountButton({ account, userId, onUnlinked, disabled = false, onBusyChange }: {
  account: { id: string; accountNumber: string; address: string };
  userId?: string;
  onUnlinked: () => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  async function unlink() {
    if (busy || disabled) return;
    setBusy(true); setError('');
    onBusyChange?.(true);
    try {
      const url = userId
        ? `/api/admin/users/${encodeURIComponent(userId)}/accounts/${encodeURIComponent(account.id)}`
        : `/api/accounts/${encodeURIComponent(account.id)}`;
      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось отвязать счёт');
      onUnlinked();
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка соединения'); }
    finally { setBusy(false); onBusyChange?.(false); }
  }
  return <div className="space-y-3">
    {!confirm ? <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setConfirm(true)}><Unlink className="mr-2 h-4 w-4" />Отвязать счёт</Button> :
      <div className="border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-medium">Отвязать лицевой счёт №{account.accountNumber}?</p>
        <p className="mt-1 text-slate-600">{account.address}</p>
        <p className="my-3">Счёт исчезнет из аккаунта. Данные в 1С, показания и платежи не удалятся. Для повторной привязки понадобятся номер счёта, район и пароль от 1С.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="destructive" size="sm" disabled={busy || disabled} onClick={unlink}>{busy ? 'Отвязываем…' : 'Да, отвязать'}</Button>
          <Button type="button" variant="outline" size="sm" disabled={busy || disabled} onClick={() => { setConfirm(false); setError(''); }}>Отмена</Button>
        </div>
        {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
      </div>}
  </div>;
}
