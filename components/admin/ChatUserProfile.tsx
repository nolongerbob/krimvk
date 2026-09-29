"use client";
import { useEffect, useState } from 'react';
import { UserDetailsDialog, type UserDetails } from './UserDetailsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { UserProfileUpdate } from './UserSettingsPanel';

export function ChatUserProfile({ userId, currentUserId, onClose, onUserUpdated, onUserDeleted }: {
  userId: string; currentUserId: string; onClose: () => void;
  onUserUpdated?: (user: UserProfileUpdate) => void;
  onUserDeleted?: (userId: string) => void;
}) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setUser(previous => previous?.id === userId ? previous : null);
    setError(null);
    void (async () => {
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/profile`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(response.status === 404 ? 'Пользователь не найден' : 'Не удалось загрузить профиль');
        const data = await response.json();
        if (controller.signal.aborted) return;
        setUser(data.user);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Не удалось загрузить профиль');
        return;
      }
      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/balance`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Balance unavailable');
        const balance = await response.json();
        if (!Number.isFinite(balance.totalDebt) || !Number.isFinite(balance.unpaidBillsCount)) throw new Error('Invalid balance');
        if (!controller.signal.aborted) setUser(user => user ? { ...user, totalDebt: balance.totalDebt, unpaidBillsCount: balance.unpaidBillsCount, balanceLoading: false, balanceError: false } : null);
      } catch {
        if (!controller.signal.aborted) setUser(user => user ? { ...user, balanceLoading: false, balanceError: true } : null);
      }
    })();
    return () => controller.abort();
  }, [userId, attempt]);

  if (user) return <UserDetailsDialog user={user} open currentUserId={currentUserId}
    onOpenChange={open => { if (!open) onClose(); }}
    onAccountUnlinked={accountId => {
      setUser(previous => previous ? { ...previous, userAccounts: previous.userAccounts.filter(account => account.id !== accountId), balanceLoading: true } : null);
      setAttempt(value => value + 1);
    }}
    onAccountAdded={account => {
      setUser(previous => previous ? { ...previous, userAccounts: [...previous.userAccounts.filter(item => item.id !== account.id), account], balanceLoading: true } : null);
      setAttempt(value => value + 1);
    }}
    onUserUpdated={updated => {
      setUser(previous => previous?.id === updated.id ? { ...previous, ...updated } : previous);
      onUserUpdated?.(updated);
    }}
    onUserDeleted={id => onUserDeleted?.(id)}
    onRoleChange={(id, role) => setUser(previous => previous?.id === id ? { ...previous, role } : previous)} />;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Профиль пользователя</DialogTitle></DialogHeader>
      {error ? <><p role="alert">{error}</p><Button onClick={() => setAttempt(value => value + 1)}>Повторить</Button></>
        : <p role="status">Загрузка профиля…</p>}
    </DialogContent>
  </Dialog>;
}
