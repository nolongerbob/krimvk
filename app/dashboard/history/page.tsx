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
        
        // На старом сайте ответ содержит поле Payments (не вложенное)
        // Строки 331-359 старого PHP кода:
        //   if($response->Payments) {
        //     $the_history = $response->Payments;
        //     $the_history = (array)$the_history;
        //     rsort($the_history); // Сортировка по дате (обратная - новые сверху)
        //     foreach($the_history as $k => $res){
        //       $out['results'][$k]['DateOfPayment'] = date('d-m-Y', strtotime($res->DateOfPayment));
        //       $out['results'][$k]['Charge'] = $res->Charge;
        //       $out['results'][$k]['Source'] = $res->Source;
        //     }
        //   }
        
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
        // Поля из старого сайта: DateOfPayment, Charge, Source
        // На старом сайте: date('d-m-Y', strtotime($res->DateOfPayment))
        // strtotime() в PHP очень гибкий и может распарсить разные форматы
        const formattedPayments = paymentsArray.map((payment: any) => {
          const dateOfPayment = payment.DateOfPayment || payment.date || payment.PaymentDate || payment.Date || "";
          let formattedDate = "";
          let dateForSort: Date | null = null;
          
          if (dateOfPayment) {
            // Логируем для отладки
            if (process.env.NODE_ENV === 'development') {
              console.log('[Payment History] Raw DateOfPayment:', dateOfPayment, typeof dateOfPayment);
            }
            
            try {
              // Пробуем распарсить дату как strtotime() в PHP
              // strtotime() может распарсить: "2024-01-15", "2024-01-15T10:30:00", "15.01.2024" и др.
              let date: Date | null = null;
              
              // Вариант 1: Прямой парсинг через Date (работает для ISO и стандартных форматов)
              date = new Date(dateOfPayment);
              
              // Если не удалось распарсить, пробуем другие форматы
              if (isNaN(date.getTime())) {
                // Вариант 2: Timestamp (число)
                if (typeof dateOfPayment === 'number') {
                  date = new Date(dateOfPayment * 1000); // Если секунды
                  if (isNaN(date.getTime())) {
                    date = new Date(dateOfPayment); // Если миллисекунды
                  }
                }
                // Вариант 3: Строка в формате ДД.ММ.ГГГГ или ДД-ММ-ГГГГ
                else if (typeof dateOfPayment === 'string') {
                  // Пробуем распарсить ДД.ММ.ГГГГ или ДД-ММ-ГГГГ
                  const match = dateOfPayment.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/);
                  if (match) {
                    const [, day, month, year] = match;
                    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                  }
                  // Пробуем формат ГГГГ-ММ-ДД
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
                // Форматируем как на старом сайте: d-m-Y (15-01-2024)
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                formattedDate = `${day}-${month}-${year}`;
                dateForSort = date;
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('[Payment History] Parsed date:', dateOfPayment, '→', formattedDate);
                }
              } else {
                // Если не удалось распарсить, используем исходное значение
                formattedDate = String(dateOfPayment);
                console.warn('[Payment History] Could not parse date:', dateOfPayment);
              }
            } catch (error) {
              console.error('[Payment History] Error parsing date:', dateOfPayment, error);
              formattedDate = String(dateOfPayment);
            }
          }
          
          return {
            date: formattedDate,
            dateForSort: dateForSort,
            amount: parseFloat(payment.Charge || payment.Amount || payment.amount || payment.Sum || 0),
            source: payment.Source || payment.source || payment.PaymentSource || "Не указан",
          };
        });
        
        // Сортируем по дате (новые сверху) как на старом сайте (rsort)
        formattedPayments.sort((a, b) => {
          if (a.dateForSort && b.dateForSort) {
            return b.dateForSort.getTime() - a.dateForSort.getTime(); // Обратная сортировка (новые сверху)
          }
          // Если дата не распарсилась, сортируем по строке
          return b.date.localeCompare(a.date);
        });
        
        // Убираем dateForSort из результата (он был только для сортировки)
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






