"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { History, Search, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function HistoryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchAccounts();
    // Устанавливаем последние 3 месяца по умолчанию
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
        if (data.accounts && data.accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке лицевых счетов");
      }
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      setError(`Ошибка при загрузке лицевых счетов: ${error?.message || "Неизвестная ошибка"}`);
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

    try {
      const params = new URLSearchParams({
        accountId: selectedAccountId,
        dateFrom,
        dateTo,
      });

      const response = await fetch(`/api/1c/payment-history?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        // Преобразуем данные из 1С в нужный формат
        const historyData = data.data?.Payments || data.data?.payments || data.data || [];
        setPayments(historyData.map((payment: any) => ({
          date: payment.Date || payment.date || payment.PaymentDate || "",
          amount: parseFloat(payment.Amount || payment.amount || payment.Sum || 0),
          source: payment.Source || payment.source || payment.PaymentSource || "Не указан",
        })));
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
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center py-12">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">История платежей</h1>
        <p className="text-gray-600">Просмотр истории платежей по лицевым счетам</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Выбор лицевого счета и периода */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Параметры поиска
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length > 0 && (
            <div>
              <Label>Лицевой счет</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedAccountId === account.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold">ЛС: {account.accountNumber}</p>
                    <p className="text-sm text-gray-600">{account.address}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom">Дата начала</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Дата окончания</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={fetchPaymentHistory}
            disabled={!selectedAccountId || !dateFrom || !dateTo || loadingHistory}
            className="w-full"
            size="lg"
          >
            {loadingHistory ? (
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
        </CardContent>
      </Card>

      {/* Таблица платежей */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              История платежей
            </CardTitle>
            <CardDescription>
              Найдено платежей: {payments.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {payment.date
                          ? new Date(payment.date).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "Не указана"}
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
          </CardContent>
        </Card>
      )}

      {payments.length === 0 && !loadingHistory && selectedAccountId && (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Платежи за выбранный период не найдены</p>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">У вас нет лицевых счетов</p>
            <p className="text-sm text-gray-400">
              Добавьте лицевой счет в разделе "Передача показаний"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




