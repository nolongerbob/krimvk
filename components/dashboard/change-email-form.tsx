'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ChangeEmailForm() {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!editing) return <Button type="button" variant="outline" onClick={() => setEditing(true)}>Изменить email</Button>;
  return <form className="mt-4 max-w-xl space-y-3" onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/change-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newEmail: email }) });
      const data = await response.json();
      setMessage(response.ok ? data.message : data.error || 'Не удалось отправить письмо');
    } catch { setMessage('Не удалось отправить письмо. Попробуйте позже.'); }
    finally { setBusy(false); }
  }}>
    <Label htmlFor="new-email">Новый email</Label>
    <Input id="new-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
    <p className="text-sm text-slate-500">Подтвердите новый адрес по письму. До этого для входа действует прежний email. Данные лицевых счетов в 1С не изменятся.</p>
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={busy}>{busy ? 'Отправляем…' : 'Отправить подтверждение'}</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => { setEditing(false); setMessage(''); }}>Закрыть</Button>
    </div>
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}
