"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  History,
  Search,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Loader2,
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

interface Payment {
  date: string;
  amount: number;
  source: string;
}

const parseAmount = (value: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

export default function HistoryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    fetchAccounts();
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    setDateFrom(threeMonthsAgo.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
  }, []);

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

  const fetchPaymentHistory = async () => {
    if (!selectedAccountId || !dateFrom || !dateTo) {
      setError("Выберите лицевой счет и период");
      return;
    }

    setLoadingHistory(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        accountId: selectedAccountId,
        dateFrom,
        dateTo,
      });

      const response = await fetch(`/api/1c/payment-history?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        let paymentsArray: Record<string, unknown>[] = [];

        if (data.data) {
          if (Array.isArray(data.data.Payments)) {
            paymentsArray = data.data.Payments;
          } else if (Array.isArray(data.data.payments)) {
            paymentsArray = data.data.payments;
          } else if (Array.isArray(data.data)) {
            paymentsArray = data.data;
          }
        } else if (data.Payments && Array.isArray(data.Payments)) {
          paymentsArray = data.Payments;
        } else if (Array.isArray(data)) {
          paymentsArray = data;
        }

        const formattedPayments = paymentsArray
          .map((payment) => {
            const dateOfPayment =
              (payment.DateOfPayment as string) ||
              (payment.date as string) ||
              (payment.PaymentDate as string) ||
              (payment.Date as string) ||
              "";
            let formattedDate = "";
            let dateForSort: Date | null = null;

            if (dateOfPayment) {
              try {
                let date = new Date(dateOfPayment);
                if (isNaN(date.getTime()) && typeof dateOfPayment === "string") {
                  const match = dateOfPayment.match(
                    /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/
                  );
                  if (match) {
                    const [, day, month, year] = match;
                    date = new Date(
                      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
                    );
                  }
                }
                if (!isNaN(date.getTime())) {
                  const day = String(date.getDate()).padStart(2, "0");
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const year = date.getFullYear();
                  formattedDate = `${day}-${month}-${year}`;
                  dateForSort = date;
                } else {
                  formattedDate = String(dateOfPayment);
                }
              } catch {
                formattedDate = String(dateOfPayment);
              }
            }

            return {
              date: formattedDate,
              dateForSort,
              amount: parseAmount(
                (payment.Charge as string | number) ||
                  (payment.Amount as string | number) ||
                  (payment.amount as string | number) ||
                  (payment.Sum as string | number) ||
                  0
              ),
              source:
                (payment.Source as string) ||
                (payment.source as string) ||
                (payment.PaymentSource as string) ||
                "Не указан",
            };
          })
          .sort((a, b) => {
            if (a.dateForSort && b.dateForSort) {
              return b.dateForSort.getTime() - a.dateForSort.getTime();
            }
            return b.date.localeCompare(a.date);
          })
          .map(({ date, amount, source }) => ({ date, amount, source }));

        setPayments(formattedPayments);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке истории платежей");
        setPayments([]);
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setError("Ошибка при загрузке истории платежей");
      setPayments([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const dateInputClass =
    "h-9 w-full min-w-0 rounded-none border border-slate-200 bg-white text-sm focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500";

  if (loading) {
    return (
      <div className={cn(dashboardPageClass, "container px-4 py-8")}>
        <div className="py-12 text-center text-sm text-slate-600">Загрузка…</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        dashboardPageClass,
        "container max-w-5xl px-4 py-8 [&_button]:!rounded-none [&_input]:!rounded-none [&_select]:!rounded-none"
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

      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          История платежей
        </h1>
        <p className="text-sm text-slate-600">
          Просмотр истории платежей по лицевым счетам
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-4 rounded-none">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {accounts.length > 0 ? (
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="shrink-0">
            <Label className="mb-1.5 block text-xs text-slate-500">Лицевой счёт</Label>
            {accounts.length === 1 && selectedAccount ? (
              <div className="flex h-9 items-center rounded-none border border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-900">
                ЛС: {selectedAccount.accountNumber}
              </div>
            ) : (
              <select
                value={selectedAccountId || ""}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="h-9 min-w-[10rem] rounded-none border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    ЛС: {account.accountNumber}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="w-full min-w-[8.5rem] max-w-[11rem] flex-1 sm:flex-none">
            <Label htmlFor="dateFrom" className="mb-1.5 block text-xs text-slate-500">
              Дата начала
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={dateInputClass}
            />
          </div>

          <div className="w-full min-w-[8.5rem] max-w-[11rem] flex-1 sm:flex-none">
            <Label htmlFor="dateTo" className="mb-1.5 block text-xs text-slate-500">
              Дата окончания
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={dateInputClass}
            />
          </div>

          <Button
            type="button"
            onClick={fetchPaymentHistory}
            disabled={!selectedAccountId || !dateFrom || !dateTo || loadingHistory}
            className={cn(
              dashboardButtonClass,
              "h-9 w-full shrink-0 rounded-none bg-blue-600 px-5 text-white hover:bg-blue-700 lg:w-auto"
            )}
          >
            {loadingHistory ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Поиск…
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Найти
              </>
            )}
          </Button>
        </div>
      ) : null}

      {payments.length > 0 ? (
        <DashboardCard>
          <DashboardCardBody className="p-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Найдено платежей: {payments.length}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5">Дата</th>
                    <th className="px-4 py-2.5">Сумма</th>
                    <th className="px-4 py-2.5">Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <tr
                      key={`${payment.date}-${payment.amount}-${index}`}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3 text-slate-900">
                        {payment.date || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                        {payment.amount.toLocaleString("ru-RU", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        ₽
                      </td>
                      <td className="px-4 py-3 text-slate-600">{payment.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCardBody>
        </DashboardCard>
      ) : null}

      {hasSearched && !loadingHistory && payments.length === 0 && selectedAccountId ? (
        <DashboardCard>
          <DashboardCardBody className="flex items-center justify-center gap-3 px-4 py-8 text-center">
            <History className="h-8 w-8 shrink-0 text-slate-300" strokeWidth={1.5} />
            <p className="text-sm text-slate-600">
              Платежи за выбранный период не найдены
            </p>
          </DashboardCardBody>
        </DashboardCard>
      ) : null}

      {!hasSearched && accounts.length > 0 ? (
        <DashboardCard className="border-dashed border-slate-200">
          <DashboardCardBody className="px-4 py-6 text-center">
            <p className="text-sm text-slate-500">
              Укажите период и нажмите «Найти», чтобы показать историю платежей
            </p>
          </DashboardCardBody>
        </DashboardCard>
      ) : null}

      {accounts.length === 0 ? (
        <DashboardCard className="border-dashed bg-slate-100/70">
          <DashboardCardBody className="py-10 text-center">
            <CreditCard
              className="mx-auto mb-3 h-10 w-10 text-slate-400"
              strokeWidth={1.75}
            />
            <p className="mb-1 text-sm text-slate-600">У вас нет лицевых счетов</p>
            <p className="text-xs text-slate-500">
              Добавьте лицевой счёт в разделе «Передача показаний»
            </p>
          </DashboardCardBody>
        </DashboardCard>
      ) : null}
    </div>
  );
}
