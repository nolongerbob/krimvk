'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Wallet } from 'lucide-react';
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
      <Card className="mb-6 border-2 border-dashed border-gray-300 bg-gray-50">
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">У вас нет лицевых счетов</p>
          <p className="text-sm text-gray-500 mb-4">
            Добавьте лицевой счет, чтобы начать работу
          </p>
          <Button asChild>
            <Link href="/dashboard/meters">Добавить лицевой счет</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
      <CardContent className="p-6">
        {accounts.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите лицевой счет
            </label>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => onSelectAccount(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {accountDataError}
          </div>
        )}

        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-100 rounded-xl">
            <Wallet className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Баланс</p>
                {loadingData ? (
                  <div className="h-10 w-40 bg-gray-200 animate-pulse rounded mb-4" />
                ) : (
                  <>
                    <p
                      className={`text-4xl font-bold ${
                        accountData?.balance !== undefined
                          ? accountData.balance < 0
                            ? 'text-green-600'
                            : accountData.balance === 0
                              ? 'text-green-600'
                              : accountData.balance > 0
                                ? 'text-red-600'
                                : 'text-gray-900'
                          : 'text-gray-900'
                      }`}
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
                        className={`text-sm mt-1 ${
                          accountData.balance < 0
                            ? 'text-green-600'
                            : accountData.balance === 0
                              ? 'text-green-600'
                              : accountData.balance > 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                        }`}
                      >
                        {accountData.balance < 0
                          ? 'Переплата'
                          : accountData.balance === 0
                            ? 'Нет задолженности'
                            : accountData.balance > 0
                              ? 'К оплате'
                              : ''}
                      </p>
                    )}
                  </>
                )}
              </div>
              {accountData &&
                selectedAccountId &&
                (accountData.balance < 0 || accountData.balance > 0) && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                  >
                    <Link href={`/dashboard/receipts/view?accountId=${selectedAccountId}`}>
                      Оплатить
                    </Link>
                  </Button>
                )}
            </div>

            {accountData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500 mb-1">Лицевой счет</p>
                    <p className="font-semibold text-gray-900">{accountData.accountNumber}</p>
                  </div>
                  {accountData.name && (
                    <div>
                      <p className="text-gray-500 mb-1">Абонент</p>
                      <p className="font-semibold text-gray-900">{accountData.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 mb-1">Адрес</p>
                    <p className="font-semibold text-gray-900">{accountData.address}</p>
                  </div>
                </div>

                {(accountData.charged > 0 || accountData.paid > 0) && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Начислено в текущем месяце</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {accountData.charged.toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ₽
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Оплачено в текущем месяце</p>
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
      </CardContent>
    </Card>
  );
}
