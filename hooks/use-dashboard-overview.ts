'use client';

import { useCallback, useState } from 'react';

export type DashboardOverviewStats = {
  unpaidBills: number;
  totalAmount: number;
  metersCount: number;
  activeApplications: number;
};

export type DashboardOverviewAccount = {
  id: string;
  accountNumber: string;
  address: string;
  name: string | null;
  region: string | null;
};

export type DashboardOverviewAccountData = {
  quickMetrics?: import('@/lib/quick-action-metrics').QuickMetrics;
  balance: number;
  paid: number;
  charged: number;
  accountNumber: string;
  address: string;
  name: string | null;
};

export type DashboardOverview = {
  profile: {
    email: string;
    emailVerified: boolean;
    name: string | null;
  };
  stats: DashboardOverviewStats;
  accounts: DashboardOverviewAccount[];
  selectedAccountId: string | null;
  accountData: DashboardOverviewAccountData | null;
};

export function useDashboardOverview() {
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async (
    accountId?: string | null,
    options?: { fresh?: boolean }
  ) => {
    const params = new URLSearchParams();
    if (accountId) params.set('accountId', accountId);
    if (options?.fresh) params.set('fresh', '1');
    const query = params.toString();
    const response = await fetch(
      `/api/dashboard/overview${query ? `?${query}` : ''}`,
      {
        credentials: 'include',
        cache: options?.fresh ? 'no-store' : 'default',
      }
    );
    if (!response.ok) {
      throw new Error('overview failed');
    }
    return (await response.json()) as DashboardOverview;
  }, []);

  return { loading, setLoading, fetchOverview };
}
