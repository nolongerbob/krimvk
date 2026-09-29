'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { DashboardOverview } from '@/hooks/use-dashboard-overview';

type AccountState = {
  userId: string;
  overview: DashboardOverview | null;
  selectedAccountId: string | null;
  loading: boolean;
  error: boolean;
};

function useHomeAccountState() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [state, setState] = useState<AccountState | null>(null);
  const request = useRef<AbortController | null>(null);
  const authenticated = status === 'authenticated' && !!userId;
  // Never expose the previous user's data while a new session is resolving.
  const current = authenticated && state?.userId === userId ? state : null;

  const refresh = useCallback(async (accountId: string | null = null) => {
    request.current?.abort();
    if (!authenticated || !userId) return;
    const controller = new AbortController();
    request.current = controller;
    setState(previous => ({
      userId,
      overview: previous?.userId === userId && previous.overview
        ? { ...previous.overview, accountData: null } : null,
      selectedAccountId: accountId,
      loading: true,
      error: false,
    }));
    try {
      const query = accountId ? `?${new URLSearchParams({ accountId })}` : '';
      const response = await fetch(`/api/dashboard/overview${query}`, {
        signal: controller.signal, credentials: 'include', cache: 'no-store',
      });
      if (!response.ok) throw new Error('Overview unavailable');
      const overview: DashboardOverview = await response.json();
      if (controller.signal.aborted) return;
      setState({ userId, overview, selectedAccountId: overview.selectedAccountId, loading: false, error: false });
    } catch {
      if (!controller.signal.aborted) {
        setState(previous => previous?.userId === userId ? { ...previous, loading: false, error: true } : previous);
      }
    }
  }, [authenticated, userId]);

  useEffect(() => {
    setState(null);
    void refresh();
    return () => request.current?.abort();
  }, [refresh]);

  const accounts = current?.overview?.accounts ?? [];
  const selectedAccountId = current?.selectedAccountId ?? null;
  const selectedAccount = accounts.find(account => account.id === selectedAccountId) ?? null;
  const selectAccount = (id: string) => {
    if (id !== selectedAccountId && accounts.some(account => account.id === id)) void refresh(id);
  };
  const overview = current?.overview ?? null;
  return {
    authenticated, userId: authenticated ? userId : undefined, accounts, selectedAccountId, selectedAccount, overview,
    accountData: overview?.selectedAccountId === selectedAccountId ? overview?.accountData : null,
    loading: status === 'loading' || (authenticated && (!current || current.loading)),
    error: current?.error ?? false,
    selectAccount,
    retry: () => { void refresh(selectedAccountId); },
  };
}

const HomeAccountContext = createContext<ReturnType<typeof useHomeAccountState> | null>(null);

export function HomeAccountProvider({ children }: { children: ReactNode }) {
  const value = useHomeAccountState();
  return <HomeAccountContext.Provider value={value}>{children}</HomeAccountContext.Provider>;
}

export function useHomeAccount() {
  const value = useContext(HomeAccountContext);
  if (!value) throw new Error('HomeAccountProvider is required');
  return value;
}
