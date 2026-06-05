"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { History, Search, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import {
  adminContainerClass,
  adminFieldClass,
  adminOutlineBtnClass,
  adminPrimaryBtnClass,
  adminSectionLabelClass,
} from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

interface Payment {
  date: string;
  amount: number;
  source: string;
}

// Единый парсер сумм из 1С (учитывает пробелы и запятые)
const parseAmount = (value: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

export default function DirectAccountPaymentHistoryPage() {
  const searchParams = useSearchParams();
  const accountNumber = searchParams.get("accountNumber");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    // Устанавливаем последние 3 месяца по умолчанию
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    setDateFrom(threeMonthsAgo.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
  }, []);

  const fetchPaymentHistory = async () => {
    if (!token || !dateFrom || !dateTo) {
      setError("Отсутствуют необходимые параметры");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        token,
        dateFrom,
        dateTo,
      });

      const response = await fetch(`/api/admin/direct-account/payment-history?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();

        // Обрабатываем Payments как массив
        let paymentsArray: any[] = [];

        if (data.data) {
          // Вариант 1: data.data.Payments (массив)
          if (Array.isArray(data.data.Payments)) {
            paymentsArray = data.data.Payments;
          }
          // Вариант 2: data.data.payments (массив)
          else if (Array.isArray(data.data.payments)) {
            paymentsArray = data.data.payments;
          }
          // Вариант 3: data.data сам по себе массив
          else if (Array.isArray(data.data)) {
            paymentsArray = data.data;
          }
          // Вариант 4: data.data - объект с Payments
          else if (data.data.Payments && Array.isArray(data.data.Payments)) {
            paymentsArray = data.data.Payments;
          }
        }
        // Вариант 5: data.Payments напрямую
        else if (data.Payments && Array.isArray(data.Payments)) {
          paymentsArray = data.Payments;
        }
        // Вариант 6: data сам по себе массив
        else if (Array.isArray(data)) {
          paymentsArray = data;
        }

        // Преобразуем данные в нужный формат
        const formattedPayments: Array<{date: string; dateForSort: Date | null; amount: number; source: string}> = paymentsArray.map((payment: any) => {
          const dateOfPayment = payment.DateOfPayment || payment.date || payment.PaymentDate || payment.Date || "";
          let formattedDate = "";
          let dateForSort: Date | null = null;

          if (dateOfPayment) {
            try {
              let date: Date | null = null;

              // Вариант 1: Прямой парсинг через Date (работает для ISO и стандартных форматов)
              date = new Date(dateOfPayment);

              // Если не удалось распарсить, пробуем другие форматы
              if (isNaN(date.getTime())) {
                // Вариант 2: Timestamp (число)
                if (typeof dateOfPayment === 'number') {
                  date = new Date(dateOfPayment * 1000);
                  if (isNaN(date.getTime())) {
                    date = new Date(dateOfPayment);
                  }
                }
                // Вариант 3: Строка в формате ДД.ММ.ГГГГ или ДД-ММ-ГГГГ
                else if (typeof dateOfPayment === 'string') {
                  const match = dateOfPayment.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/);
                  if (match) {
                    const [, day, month, year] = match;
                    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                  }
                  else {
                    const match2 = dateOfPayment.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
                    if (match2) {
                      const [, year, month, day] = match2;
                      date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                    }
                  }
                }
              }

              if (date && !isNaN(date.getTime())) {
                // Форматируем: d-m-Y (15-01-2024)
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                formattedDate = `${day}-${month}-${year}`;
                dateForSort = date;
              } else {
                formattedDate = String(dateOfPayment);
              }
            } catch (error) {
              console.error('[Payment History] Error parsing date:', dateOfPayment, error);
              formattedDate = String(dateOfPayment);
            }
          }

          return {
            date: formattedDate,
            dateForSort: dateForSort,
            amount: parseAmount(payment.Charge || payment.Amount || payment.amount || payment.Sum || 0),
            source: payment.Source || payment.source || payment.PaymentSource || "Не указан",
          };
        });

        // Сортируем по дате (новые сверху)
        formattedPayments.sort((a, b) => {
          if (a.dateForSort && b.dateForSort) {
            return b.dateForSort.getTime() - a.dateForSort.getTime();
          }
          return b.date.localeCompare(a.date);
        });

        // Убираем dateForSort из результата
        const finalPayments = formattedPayments.map(({ dateForSort, ...rest }) => rest);

        setPayments(finalPayments);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке истории платежей");
        setPayments([]);
      }
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      setError("Ошибка при загрузке истории платежей");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Отсутствуют необходимые параметры подключения</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={cn(adminContainerClass, "max-w-6xl")}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">История платежей</h1>
            <p className="text-sm text-slate-600">Лицевой счет: {accountNumber}</p>
          </div>
          <Button variant="outline" onClick={() => window.close()} className={adminOutlineBtnClass}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Закрыть
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Выбор периода */}
        <DashboardCard className="mb-6">
          <DashboardCardBody className="space-y-4">
            <p className={cn(adminSectionLabelClass, "flex items-center gap-2")}>
              <Search className="h-4 w-4" />
              Параметры поиска
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">Дата начала</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={cn("mt-1", adminFieldClass)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Дата окончания</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={cn("mt-1", adminFieldClass)}
                />
              </div>
            </div>

            <Button
              onClick={fetchPaymentHistory}
              disabled={!dateFrom || !dateTo || loading}
              className={cn("w-full", adminPrimaryBtnClass)}
            >
              {loading ? (
                <>
                  <History className="h-4 w-4 mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Найти платежи
                </>
              )}
            </Button>
          </DashboardCardBody>
        </DashboardCard>

        {/* Таблица платежей */}
        {payments.length > 0 && (
          <DashboardCard>
            <DashboardCardBody>
              <p className={cn(adminSectionLabelClass, "mb-2 flex items-center gap-2")}>
                <History className="h-4 w-4" />
                История платежей
              </p>
              <p className="mb-4 text-sm text-slate-600">Найдено платежей: {payments.length}</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Дата</th>
                      <th className="text-left p-3">Сумма</th>
                      <th className="text-left p-3">Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          {payment.date || "Не указана"}
                        </td>
                        <td className="p-3 font-semibold">
                          {payment.amount.toLocaleString("ru-RU", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          ₽
                        </td>
                        <td className="p-3">{payment.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardCardBody>
          </DashboardCard>
        )}

        {payments.length === 0 && !loading && dateFrom && dateTo && (
          <DashboardCard>
            <DashboardCardBody className="py-12 text-center">
              <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Платежи за выбранный период не найдены</p>
            </DashboardCardBody>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
