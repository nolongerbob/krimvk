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

  const fetchOverview = useCallback(async (accountId?: string | null) => {
    const params = new URLSearchParams({ fresh: '1' });
    if (accountId) params.set('accountId', accountId);
    const response = await fetch(`/api/dashboard/overview?${params}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('overview failed');
    }
    return (await response.json()) as DashboardOverview;
  }, []);

  return { loading, setLoading, fetchOverview };
}
