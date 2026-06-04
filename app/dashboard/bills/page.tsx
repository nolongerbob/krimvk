"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { cn } from "@/lib/utils";
import {
  dashboardButtonClass,
  dashboardPageClass,
} from "@/components/dashboard/dashboard-styles";

interface Account {
  id: string;
  accountNumber: string;
  address: string;
  name: string | null;
}

interface Bill {
  period: string;
  amount: number;
  status: "UNPAID" | "PAID" | "OVERDUE";
  dueDate?: string;
  paidAt?: string;
  service?: string;
}

const parseAmount = (value: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

const statusConfig = {
  UNPAID: {
    label: "Не оплачен",
    tagClass: "bg-red-50 text-red-700",
  },
  PAID: {
    label: "Оплачен",
    tagClass: "bg-green-50 text-green-700",
  },
  OVERDUE: {
    label: "Просрочен",
    tagClass: "bg-orange-50 text-orange-600",
  },
};

function getBalanceFromAccountData(data: Record<string, unknown> | null) {
  if (!data) {
    return {
      debtAmount: 0,
      overpayAmount: 0,
      hasDebt: false,
      hasOverpay: false,
      isZero: true,
    };
  }
  const commonDuty = parseAmount(
    (data.CommonDuty as string | number) || (data.commonDuty as string | number) || "0"
  );
  const debtAmount = commonDuty > 0 ? commonDuty : 0;
  const overpayAmount = commonDuty < 0 ? Math.abs(commonDuty) : 0;
  return {
    debtAmount,
    overpayAmount,
    hasDebt: debtAmount > 0.01,
    hasOverpay: overpayAmount > 0.01,
    isZero: debtAmount <= 0.01 && overpayAmount <= 0.01,
  };
}

function formatMoney(amount: number) {
  return amount.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BillsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBills, setLoadingBills] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [accountData, setAccountData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchBills();
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке лицевых счетов");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(`Ошибка при загрузке лицевых счетов: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    if (!selectedAccountId) return;

    setLoadingBills(true);
    setError(null);

    try {
      const response = await fetch(`/api/1c/get-data?accountId=${selectedAccountId}`);

      if (response.ok) {
        const data = await response.json();
        const responseData = (data.data || data) as Record<string, unknown>;
        setAccountData(responseData);

        const billsList: Bill[] = [];
        const commonDuty = parseAmount(
          (responseData.CommonDuty as string | number) ||
            (responseData.commonDuty as string | number) ||
            "0"
        );
        const startCommonDuty = parseAmount(
          (responseData.StartCommonDuty as string | number) ||
            (responseData.startCommonDuty as string | number) ||
            "0"
        );

        const debtAmount = commonDuty > 0 ? commonDuty : 0;
        const hasDebt = debtAmount > 0.01;

        if (!hasDebt) {
          setBills([]);
          return;
        }

        const today = new Date();
        const monthOffset = today.getDate() < 5 ? -2 : -1;
        const periodMonthDate = new Date(
          today.getFullYear(),
          today.getMonth() + monthOffset,
          1
        );
        const currentMonth = periodMonthDate.toLocaleDateString("ru-RU", {
          month: "long",
          year: "numeric",
        });

        const startDutys = responseData.StartDutys;
        if (hasDebt && Array.isArray(startDutys)) {
          startDutys.forEach((duty: Record<string, unknown>) => {
            const amount = parseAmount(
              (duty.Duty as string | number) || (duty.duty as string | number) || "0"
            );
            if (amount > 0) {
              billsList.push({
                period: (duty.Service as string) || "Долг за предыдущий период",
                amount,
                status: "OVERDUE",
                service: (duty.Service as string) || "Долг",
              });
            }
          });
        }

        if (
          hasDebt &&
          startCommonDuty > 0.01 &&
          (!Array.isArray(startDutys) || startDutys.length === 0)
        ) {
          billsList.push({
            period: "Долг на начало периода",
            amount: startCommonDuty,
            status: "OVERDUE",
            service: "Долг",
          });
        }

        const charges = responseData.ChargesAndPayments;
        if (hasDebt && Array.isArray(charges)) {
          charges.forEach((charge: Record<string, unknown>) => {
            const amount = parseAmount(
              (charge.Charge as string | number) ||
                (charge.ChargeFull as string | number) ||
                (charge.charge as string | number) ||
                "0"
            );
            if (amount > 0) {
              billsList.push({
                period: currentMonth,
                amount,
                status: "UNPAID",
                service:
                  (charge.Service as string) ||
                  (charge.service as string) ||
                  "Водоснабжение",
              });
            }
          });
        }

        const totalUnpaidBillsAmount = billsList
          .filter((bill) => bill.status === "UNPAID" || bill.status === "OVERDUE")
          .reduce((sum, bill) => sum + bill.amount, 0);

        const difference = debtAmount - totalUnpaidBillsAmount;
        if (difference > 0.01 && hasDebt) {
          billsList.push({
            period: "Прочая задолженность",
            amount: difference,
            status: "OVERDUE",
            service: "Прочее",
          });
        }

        if (billsList.length === 0 && hasDebt) {
          billsList.push({
            period: "Задолженность",
            amount: debtAmount,
            status: "UNPAID",
            service: "К оплате",
          });
        }

        billsList.sort((a, b) => {
          const statusOrder = { OVERDUE: 0, UNPAID: 1, PAID: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });

        setBills(billsList);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке счетов");
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
      setError("Ошибка при загрузке данных счетов из 1С");
    } finally {
      setLoadingBills(false);
    }
  };

  const unpaidBills = bills.filter(
    (bill) => bill.status === "UNPAID" || bill.status === "OVERDUE"
  );
  const paidBills = bills.filter((bill) => bill.status === "PAID");
  const balance = getBalanceFromAccountData(accountData);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const payHref = selectedAccountId
    ? `/dashboard/receipts/view?accountId=${selectedAccountId}`
    : "/dashboard/receipts";

  const displayTotal = balance.hasDebt
    ? balance.debtAmount
    : balance.hasOverpay
      ? balance.overpayAmount
      : 0;

  if (loading) {
    return (
      <div className={cn(dashboardPageClass, "container px-4 py-8")}>
        <div className="py-12 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600">Загрузка…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        dashboardPageClass,
        "container max-w-4xl px-4 py-8 [&_button]:!rounded-none"
      )}
    >
      <div className="mb-6">
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(dashboardButtonClass, "h-9 border-slate-200")}
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          Счета и оплата
        </h1>
        <p className="text-sm text-slate-600">Управление счетами за водоснабжение</p>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6 rounded-none">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {accounts.length > 0 ? (
        <section className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Лицевой счёт
          </p>
          <div className="flex flex-wrap gap-2">
            {accounts.map((account) => {
              const selected = selectedAccountId === account.id;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedAccountId(account.id)}
                  className={cn(
                    "rounded-none border px-3 py-2 text-left text-sm transition-colors",
                    selected
                      ? "border-slate-300 bg-slate-100 font-medium text-slate-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="font-semibold">ЛС: {account.accountNumber}</span>
                  <span className="mt-0.5 block max-w-[220px] truncate text-xs text-slate-500">
                    {account.address}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedAccountId ? (
        <>
          <DashboardCard className="mb-8">
            <DashboardCardBody className="p-5 sm:p-6">
              {loadingBills ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-600" />
                  <p className="text-sm text-slate-600">Загрузка данных…</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500">
                      {balance.hasDebt
                        ? "Общая сумма к оплате"
                        : balance.hasOverpay
                          ? "Переплата"
                          : "Задолженность"}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-4xl font-bold tracking-tight",
                        balance.hasDebt
                          ? "text-slate-900"
                          : balance.hasOverpay
                            ? "text-green-700"
                            : "text-slate-900"
                      )}
                    >
                      {formatMoney(displayTotal)} ₽
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Неоплаченных счетов:{" "}
                      <span className="font-medium text-slate-900">
                        {unpaidBills.length}
                      </span>
                      {" · "}
                      Оплаченных:{" "}
                      <span className="font-medium text-slate-900">
                        {paidBills.length}
                      </span>
                    </p>
                    {balance.isZero ? (
                      <p className="mt-1 text-sm text-slate-500">Нет задолженности</p>
                    ) : balance.hasDebt ? (
                      <p className="mt-1 text-sm text-red-600">Требуется оплата</p>
                    ) : null}
                  </div>
                  {balance.hasDebt ? (
                    <Button
                      asChild
                      className={cn(
                        dashboardButtonClass,
                        "h-10 shrink-0 rounded-none bg-blue-600 px-6 text-white hover:bg-blue-700"
                      )}
                    >
                      <Link href={payHref}>Оплатить все счета</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </DashboardCardBody>
          </DashboardCard>

          {!loadingBills && bills.length > 0 ? (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Детализация
              </p>
              <ul className="space-y-2">
                {bills.map((bill, index) => {
                  const status = statusConfig[bill.status];
                  const title = bill.service || bill.period;
                  const isUnpaid =
                    bill.status === "UNPAID" || bill.status === "OVERDUE";

                  return (
                    <li key={`${bill.service}-${bill.period}-${index}`}>
                      <DashboardCard>
                        <DashboardCardBody className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:flex-nowrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {title}
                              </p>
                              <span
                                className={cn(
                                  "rounded-none px-2 py-0.5 text-xs font-medium",
                                  status.tagClass
                                )}
                              >
                                {status.label}
                              </span>
                            </div>
                            {bill.period && bill.service ? (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {bill.period}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <p className="text-base font-semibold tabular-nums text-slate-900">
                              {formatMoney(bill.amount)} ₽
                            </p>
                            {isUnpaid ? (
                              <Button
                                asChild
                                variant="outline"
                                size="icon"
                                className={cn(
                                  dashboardButtonClass,
                                  "h-9 w-9 shrink-0 border-slate-200"
                                )}
                                title="Скачать квитанцию"
                              >
                                <Link href={payHref}>
                                  <Download className="h-4 w-4 text-slate-600" />
                                </Link>
                              </Button>
                            ) : (
                              <CheckCircle
                                className="h-5 w-5 text-green-600"
                                strokeWidth={1.75}
                              />
                            )}
                          </div>
                        </DashboardCardBody>
                      </DashboardCard>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {selectedAccount && !loadingBills && bills.length === 0 ? (
            <DashboardCard className="border-dashed bg-slate-50/80">
              <DashboardCardBody className="py-12 text-center">
                <CreditCard
                  className="mx-auto mb-4 h-10 w-10 text-slate-400"
                  strokeWidth={1.75}
                />
                <p className="text-sm text-slate-600">Нет счетов к оплате</p>
                <p className="mt-1 text-xs text-slate-500">
                  ЛС {selectedAccount.accountNumber} — задолженность отсутствует
                </p>
              </DashboardCardBody>
            </DashboardCard>
          ) : null}
        </>
      ) : null}

      {accounts.length === 0 ? (
        <DashboardCard className="border-dashed bg-slate-100/70">
          <DashboardCardBody className="py-12 text-center">
            <CreditCard
              className="mx-auto mb-4 h-10 w-10 text-slate-400"
              strokeWidth={1.75}
            />
            <p className="mb-2 text-sm text-slate-600">У вас нет лицевых счетов</p>
            <p className="text-xs text-slate-500">
              Добавьте лицевой счёт в разделе «Передача показаний»
            </p>
          </DashboardCardBody>
        </DashboardCard>
      ) : null}
    </div>
  );
}
