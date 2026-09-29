'use client';

import { useEffect, useState } from 'react';
import { Save, Settings, ShieldCheck, Trash2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UnlinkAccountButton } from '@/components/dashboard/UnlinkAccountButton';
import type { UserDetails } from './UserDetailsDialog';
import { AdminAddAccountForm } from './AdminAddAccountForm';

export type UserProfileUpdate = Pick<UserDetails, 'id' | 'email' | 'name' | 'phone' | 'address' | 'role'>;
type SettingsData = {
  linkedServices: { id: string; provider: string }[];
  canUnlinkService: boolean;
  deletionBlockReason: string | null;
  deletionSummary: { accounts: number; applications: number; questions: number; meters: number; bills: number };
};
const serviceNames: Record<string, string> = { yandex: 'Яндекс', vk: 'VK ID', gosuslugi: 'Госуслуги', esia: 'Госуслуги', google: 'Google', mail_ru: 'Mail.ru', ok_ru: 'Одноклассники' };
const sectionClass = 'border border-slate-200 bg-white p-4 sm:p-5';

export function UserSettingsPanel({ user, currentUserId, onSaved, onDeleted, onAccountUnlinked, onAccountAdded, onBusyChange }: {
  user: UserDetails; currentUserId?: string;
  onSaved: (user: UserProfileUpdate) => void;
  onDeleted: (userId: string) => void;
  onAccountUnlinked: (accountId: string) => void;
  onAccountAdded?: (account: UserDetails['userAccounts'][number]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.address || '');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [settingsError, setSettingsError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [unlinkId, setUnlinkId] = useState<string | null>(null);
  const endpoint = `/api/admin/users/${encodeURIComponent(user.id)}`;

  useEffect(() => { setName(user.name || ''); setPhone(user.phone || ''); setAddress(user.address || ''); }, [user.id, user.name, user.phone, user.address]);
  useEffect(() => {
    const controller = new AbortController();
    setSettings(null); setSettingsError('');
    void (async () => {
      try {
        const response = await fetch(`${endpoint}/settings`, { signal: controller.signal, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Не удалось загрузить настройки');
        if (!controller.signal.aborted) setSettings(data.settings);
      } catch (e) { if (!controller.signal.aborted) setSettingsError(e instanceof Error ? e.message : 'Не удалось загрузить настройки'); }
    })();
    return () => controller.abort();
  }, [endpoint, revision]);

  function changeBusy(value: string) { setBusy(value); onBusyChange(Boolean(value)); }
  async function mutate(path: string, method: string, body: unknown) {
    const response = await fetch(`${endpoint}/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие');
    return data;
  }
  const blocked = user.id === currentUserId ? 'Нельзя удалить свой аккаунт из панели администратора.'
    : user.role === 'ADMIN' ? 'Сначала измените роль этого пользователя на «Пользователь».' : settings?.deletionBlockReason;
  const changed = name.trim() !== (user.name || '') || phone.trim() !== (user.phone || '') || address.trim() !== (user.address || '');

  return <div className="space-y-4">
    <section className={sectionClass}>
      <h3 className="mb-1 flex items-center gap-2 font-semibold"><Settings size={18} />Данные профиля</h3>
      <p className="mb-4 text-xs text-slate-500">Изменения относятся к профилю на сайте. Данные абонента в 1С не меняются.</p>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault(); if (busy || !changed) return;
        changeBusy('save'); setError(''); setSuccess('');
        try {
          const data = await mutate('profile', 'PATCH', { name: name.trim() || null, phone: phone.trim() || null, address: address.trim() || null });
          onSaved(data.user); setSuccess('Данные профиля сохранены');
        } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка соединения'); }
        finally { changeBusy(''); }
      }}>
        <fieldset disabled={Boolean(busy)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1"><Label htmlFor="admin-profile-name">Имя и фамилия</Label><Input id="admin-profile-name" value={name} maxLength={150} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="admin-profile-phone">Телефон</Label><Input id="admin-profile-phone" type="tel" value={phone} maxLength={50} onChange={e => setPhone(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="admin-profile-address">Адрес профиля</Label><Input id="admin-profile-address" value={address} maxLength={500} onChange={e => setAddress(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="admin-profile-email">Почта для входа</Label><Input id="admin-profile-email" value={user.email} readOnly className="bg-slate-50 text-slate-500" /><p className="text-xs text-slate-500">Смена почты — через подтверждение владельцем в личном кабинете.</p></div>
        </fieldset>
        <Button type="submit" disabled={Boolean(busy) || !changed} className="gap-2"><Save size={16} />{busy === 'save' ? 'Сохраняем…' : 'Сохранить изменения'}</Button>
      </form>
    </section>

    {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {success && <p role="status" className="border border-green-200 bg-green-50 p-3 text-sm text-green-800">{success}</p>}

    <div className="grid gap-4 md:grid-cols-2">
      <section className={sectionClass}>
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><Unlink size={18} />Лицевые счета</h3>
        <div className="mb-4"><AdminAddAccountForm key={user.id} user={user} disabled={Boolean(busy)} onBusyChange={value => changeBusy(value ? 'add-account' : '')} onAdded={account => { onAccountAdded?.(account); setRevision(value => value + 1); }} /></div>
        {!user.userAccounts.length ? <p className="text-sm text-slate-500">Нет привязанных лицевых счетов</p> : <div className="space-y-4">
          {user.userAccounts.map(account => <div key={account.id} className="space-y-2 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
            <p className="text-sm font-medium">№ {account.accountNumber}</p><p className="break-words text-xs text-slate-500">{account.address}</p>
            <UnlinkAccountButton account={account} userId={user.id} disabled={Boolean(busy)}
              onBusyChange={value => changeBusy(value ? `account:${account.id}` : '')}
              onUnlinked={() => { onAccountUnlinked(account.id); setRevision(value => value + 1); setSuccess('Лицевой счёт отвязан. Данные в 1С сохранены.'); }} />
          </div>)}
        </div>}
      </section>
      <section className={sectionClass}>
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><ShieldCheck size={18} />Сервисы входа</h3>
        {!settings && !settingsError && <p role="status" className="text-sm text-slate-500">Загружаем настройки…</p>}
        {settingsError && <div role="alert" className="space-y-2 text-sm text-red-700"><p>{settingsError}</p><Button type="button" variant="outline" onClick={() => setRevision(value => value + 1)}>Повторить</Button></div>}
        {settings && (!settings.linkedServices.length ? <p className="text-sm text-slate-500">Нет привязанных сервисов входа</p> : <div className="space-y-3">
          {settings.linkedServices.map(service => <div key={service.id} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{serviceNames[service.provider] || service.provider}</span>
              {unlinkId !== service.id && <Button type="button" variant="outline" size="sm" disabled={Boolean(busy) || !settings.canUnlinkService} onClick={() => { setUnlinkId(service.id); setError(''); }}>Отвязать {serviceNames[service.provider] || service.provider}</Button>}
            </div>
            {unlinkId === service.id && <div className="mt-2 space-y-3 border border-amber-200 bg-amber-50 p-3 text-sm">
              <p>Отвязать вход через {serviceNames[service.provider] || service.provider}? Сам аккаунт во внешнем сервисе не удаляется. Текущая сессия на сайте не завершается.</p>
              <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="destructive" disabled={Boolean(busy) || !settings.canUnlinkService} onClick={async () => {
                if (busy) return; changeBusy(`service:${service.id}`); setError(''); setSuccess('');
                try { await mutate(`services/${encodeURIComponent(service.id)}`, 'DELETE', { confirmation: service.provider }); setUnlinkId(null); setRevision(value => value + 1); setSuccess('Сервис входа отвязан'); }
                catch (e) { setError(e instanceof Error ? e.message : 'Ошибка соединения'); }
                finally { changeBusy(''); }
              }}>{busy === `service:${service.id}` ? 'Отвязываем…' : 'Подтвердить отвязку'}</Button><Button type="button" variant="outline" size="sm" disabled={Boolean(busy)} onClick={() => setUnlinkId(null)}>Отмена</Button></div>
            </div>}
          </div>)}
          {!settings.canUnlinkService && <p className="text-xs text-amber-800">Последний способ входа нельзя отвязать. Сначала пользователь должен подключить другой сервис или задать пароль и подтвердить почту.</p>}
        </div>)}
      </section>
    </div>

    <section className="border border-red-200 bg-red-50/40 p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-semibold text-red-800"><Trash2 size={18} />Удаление аккаунта</h3>
      <p className="my-3 text-sm text-slate-600">Удаляется профиль на сайте и история его кабинета. Лицевые счета, начисления и платежи в 1С сохраняются.</p>
      {blocked ? <p className="text-sm text-amber-800">{blocked}</p> : !deleteOpen ? <Button type="button" variant="outline" disabled={Boolean(busy) || !settings} className="border-red-300 text-red-700" onClick={() => { setDeleteOpen(true); setError(''); setSuccess(''); }}>Удалить аккаунт пользователя</Button> :
        <form className="space-y-3 border-t border-red-200 pt-3" onSubmit={async event => {
          event.preventDefault(); if (busy || confirmation !== user.email || !settings) return;
          changeBusy('delete'); setError('');
          try { await mutate('profile', 'DELETE', { confirmation }); onDeleted(user.id); }
          catch (e) { setError(e instanceof Error ? e.message : 'Ошибка соединения'); }
          finally { changeBusy(''); }
        }}>
          <p className="text-sm text-red-900">Удаление необратимо: исчезнут профиль, способы входа, привязки счетов, показания, счета, заявки и переписка на сайте. Договоры и сообщения об авариях у организации сохранятся.</p>
          {settings && <p className="text-xs text-slate-600">Привязок: {settings.deletionSummary.accounts} · Заявок: {settings.deletionSummary.applications} · Обращений: {settings.deletionSummary.questions} · Счётчиков: {settings.deletionSummary.meters} · Счетов на сайте: {settings.deletionSummary.bills}</p>}
          <div className="max-w-md space-y-1"><Label htmlFor="admin-delete-confirmation">Для подтверждения введите {user.email}</Label><Input id="admin-delete-confirmation" required autoComplete="off" value={confirmation} disabled={Boolean(busy)} onChange={e => setConfirmation(e.target.value)} /></div>
          <div className="flex flex-wrap gap-2"><Button type="submit" variant="destructive" disabled={Boolean(busy) || confirmation !== user.email || !settings}>{busy === 'delete' ? 'Удаляем…' : 'Удалить безвозвратно'}</Button><Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => { setDeleteOpen(false); setConfirmation(''); setError(''); }}>Отмена</Button></div>
        </form>}
    </section>
  </div>;
}
