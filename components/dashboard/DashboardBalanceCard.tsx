'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardBody } from '@/components/dashboard/DashboardCard';
import { CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardButtonClass } from '@/components/dashboard/dashboard-styles';
import type { DashboardAccount, DashboardAccountData } from '@/lib/dashboard-types';

type Props = {
  accounts: DashboardAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
  accountData: DashboardAccountData | null;
  loadingData: boolean;
  accountDataError: string | null;
};

export function DashboardBalanceCard({
  accounts,
  selectedAccountId,
  onSelectAccount,
  accountData,
  loadingData,
  accountDataError,
}: Props) {
  if (accounts.length === 0) {
    return (
      <DashboardCard className="mb-6 border border-dashed border-slate-200 bg-slate-100/70">
        <DashboardCardBody className="text-center">
          <CreditCard className="mx-auto mb-4 h-10 w-10 text-slate-400" strokeWidth={1.75} />
          <p className="mb-2 text-slate-700">У вас нет лицевых счетов</p>
          <p className="mb-4 text-sm text-slate-500">
            Добавьте лицевой счет, чтобы начать работу
          </p>
          <Button asChild className={dashboardButtonClass}>
            <Link href="/dashboard/meters">Добавить лицевой счет</Link>
          </Button>
        </DashboardCardBody>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className="mb-6">
      <DashboardCardBody>
        {accounts.length > 1 && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Выберите лицевой счет
            </label>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => onSelectAccount(e.target.value)}
              className="w-full rounded-none border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  ЛС: {account.accountNumber} - {account.address}
                </option>
              ))}
            </select>
          </div>
        )}

        {accountDataError && (
          <div className="mb-4 rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {accountDataError}
          </div>
        )}

        <div className="flex gap-5">
          <Wallet className="mt-1 h-8 w-8 shrink-0 text-slate-500" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm text-slate-500">Баланс</p>
                {loadingData ? (
                  <div className="mb-4 h-10 w-40 animate-pulse rounded-none bg-slate-200" />
                ) : (
                  <>
                    <p
                      className={cn(
                        'text-4xl font-bold',
                        accountData?.balance !== undefined
                          ? accountData.balance <= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                          : 'text-slate-900'
                      )}
                    >
                      {accountData?.balance !== undefined
                        ? `${Math.abs(accountData.balance).toLocaleString('ru-RU', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} ₽`
                        : '— ₽'}
                    </p>
                    {accountData?.balance !== undefined && (
                      <p
                        className={cn(
                          'mt-1 text-sm',
                          accountData.balance <= 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {accountData.balance < 0
                          ? 'Переплата'
                          : accountData.balance === 0
                            ? 'Нет задолженности'
                            : 'К оплате'}
                      </p>
                    )}
                  </>
                )}
              </div>
              {accountData &&
                selectedAccountId &&
                accountData.balance !== 0 && (
                  <Button
                    asChild
                    className={cn(
                      dashboardButtonClass,
                      'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    <Link href={`/dashboard/receipts/view?accountId=${selectedAccountId}`}>
                      Оплатить
                    </Link>
                  </Button>
                )}
            </div>

            {accountData && (
              <>
                <div className="mb-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-slate-500">Лицевой счет</p>
                    <p className="font-semibold text-slate-900">{accountData.accountNumber}</p>
                  </div>
                  {accountData.name && (
                    <div>
                      <p className="mb-1 text-slate-500">Абонент</p>
                      <p className="font-semibold text-slate-900">{accountData.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-slate-500">Адрес</p>
                    <p className="font-semibold text-slate-900">{accountData.address}</p>
                  </div>
                </div>

                {(accountData.charged > 0 || accountData.paid > 0) && (
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <p className="mb-1 text-xs text-slate-500">Начислено в текущем месяце</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {accountData.charged.toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ₽
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-500">Оплачено в текущем месяце</p>
                      <p className="text-sm font-semibold text-green-600">
                        {accountData.paid.toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ₽
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DashboardCardBody>
    </DashboardCard>
  );
}
