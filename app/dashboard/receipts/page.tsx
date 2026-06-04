"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Download,
  AlertCircle,
  CreditCard,
  Calendar,
  Eye,
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

export default function ReceiptsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchAccounts();
    const today = new Date();
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const firstDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    const lastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    setDateFrom(firstDay.toISOString().split("T")[0]);
    setDateTo(lastDay.toISOString().split("T")[0]);
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

  const openReceipt = (isPeriod: boolean = false) => {
    if (!selectedAccountId) {
      setError("Выберите лицевой счет");
      return;
    }

    setError(null);
    const params = new URLSearchParams({ accountId: selectedAccountId });

    if (isPeriod && dateFrom && dateTo) {
      params.append("dateFrom", dateFrom);
      params.append("dateTo", dateTo);
    }

    window.open(`/dashboard/receipts/view?${params.toString()}`, "_blank");
  };

  const dateInputClass =
    "mt-1.5 h-9 rounded-none border border-slate-200 bg-white focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500";

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
        "container max-w-4xl px-4 py-8 [&_button]:!rounded-none [&_input]:!rounded-none"
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
          Квитанции на оплату
        </h1>
        <p className="text-sm text-slate-600">Скачайте квитанцию для оплаты услуг</p>
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
        <div className="space-y-4">
          <DashboardCard>
            <DashboardCardBody className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
                  Текущая квитанция
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Квитанция за текущий месяц
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => openReceipt(false)}
                  className={cn(
                    dashboardButtonClass,
                    "h-9 rounded-none bg-blue-600 px-4 text-white hover:bg-blue-700"
                  )}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Просмотреть
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openReceipt(false)}
                  className={cn(
                    dashboardButtonClass,
                    "h-9 border-slate-200 px-4"
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </DashboardCardBody>
          </DashboardCard>

          <DashboardCard>
            <DashboardCardBody className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Calendar className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
                  Квитанция за период
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Выберите период для генерации квитанции
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-md">
                  <div>
                    <Label htmlFor="dateFrom" className="text-sm text-slate-700">
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
                  <div>
                    <Label htmlFor="dateTo" className="text-sm text-slate-700">
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
                </div>

                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    onClick={() => openReceipt(true)}
                    disabled={!dateFrom || !dateTo}
                    className={cn(
                      dashboardButtonClass,
                      "h-9 w-fit rounded-none bg-blue-600 px-6 text-white hover:bg-blue-700"
                    )}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Просмотреть
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openReceipt(true)}
                    disabled={!dateFrom || !dateTo}
                    className={cn(
                      dashboardButtonClass,
                      "h-9 w-fit border-slate-200 px-4"
                    )}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </DashboardCardBody>
          </DashboardCard>
        </div>
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
