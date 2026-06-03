export type DashboardAccount = {
  id: string;
  accountNumber: string;
  address: string;
  name: string | null;
  region?: string | null;
};

export type DashboardAccountData = {
  balance: number;
  paid: number;
  charged: number;
  accountNumber: string;
  address: string;
  name: string | null;
};
