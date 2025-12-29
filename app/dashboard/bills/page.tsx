"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, AlertCircle, Calendar, Loader2, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

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

const statusConfig = {
  UNPAID: { label: "Не оплачен", icon: AlertCircle, className: "text-red-500" },
  PAID: { label: "Оплачен", icon: CheckCircle, className: "text-green-500" },
  OVERDUE: { label: "Просрочен", icon: AlertCircle, className: "text-orange-500" },
};

export default function BillsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBills, setLoadingBills] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [accountData, setAccountData] = useState<any>(null);

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

  const fetchBills = async () => {
    if (!selectedAccountId) return;
    
    setLoadingBills(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/1c/get-data?accountId=${selectedAccountId}`);
      
      if (response.ok) {
        const data = await response.json();
        const responseData = data.data || data;
        setAccountData(responseData);
        
        // Функция для правильного парсинга суммы
        const parseAmount = (value: string | number): number => {
          if (typeof value === "number") return value;
          if (!value) return 0;
          const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
          const parsed = parseFloat(normalized);
          return isNaN(parsed) ? 0 : parsed;
        };
        
        // Формируем счета из данных 1С
        const billsList: Bill[] = [];
        
        const commonDuty = parseAmount(responseData.CommonDuty || responseData.commonDuty || "0");
        const commonPayment = parseAmount(responseData.CommonPayment || responseData.commonPayment || "0");
        const startCommonDuty = parseAmount(responseData.StartCommonDuty || responseData.startCommonDuty || "0");
        
        // Логируем для отладки
        console.log("Bills data from 1C:", {
          CommonDuty: commonDuty,
          CommonPayment: commonPayment,
          StartCommonDuty: startCommonDuty,
          StartDutys: responseData.StartDutys,
          ChargesAndPayments: responseData.ChargesAndPayments,
          fullData: responseData
        });
        
        // В 1С отрицательное значение CommonDuty означает долг (к оплате)
        // Используем абсолютное значение для определения суммы долга
        const debtAmount = Math.abs(commonDuty);
        const hasDebt = debtAmount > 0.01; // Есть долг если больше 1 копейки
        
        // Если нет долга (баланс равен нулю), не показываем счета
        if (!hasDebt) {
          setBills([]);
          return;
        }
        
        const today = new Date();
        const currentMonth = today.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
        
        // 1. Долги за предыдущие периоды (StartDutys)
        // Показываем только если есть задолженность
        if (hasDebt && responseData.StartDutys && Array.isArray(responseData.StartDutys)) {
          responseData.StartDutys.forEach((duty: any) => {
            const amount = parseAmount(duty.Duty || duty.duty || "0");
            if (amount > 0) {
              billsList.push({
                period: duty.Service || "Долг за предыдущий период",
                amount: amount,
                status: "OVERDUE",
                service: duty.Service || "Долг",
              });
            }
          });
        }
        
        // 2. Если есть общий долг на начало периода, но нет разбивки по StartDutys
        if (hasDebt && Math.abs(startCommonDuty) > 0.01 && (!responseData.StartDutys || responseData.StartDutys.length === 0)) {
          billsList.push({
            period: "Долг на начало периода",
            amount: startCommonDuty,
            status: "OVERDUE",
            service: "Долг",
          });
        }
        
        // 3. Начисления за текущий период (ChargesAndPayments)
        // Показываем только если есть задолженность
        if (hasDebt && responseData.ChargesAndPayments && Array.isArray(responseData.ChargesAndPayments)) {
          responseData.ChargesAndPayments.forEach((charge: any) => {
            const amount = parseAmount(charge.Charge || charge.ChargeFull || charge.charge || "0");
            if (amount > 0) {
              // Все счета неоплаченные, так как есть задолженность
              billsList.push({
                period: currentMonth,
                amount: amount,
                status: "UNPAID",
                service: charge.Service || charge.service || "Водоснабжение",
                dueDate: undefined,
              });
            }
          });
        }
        
        // 4. Проверяем сумму всех неоплаченных счетов и сравниваем с суммой долга
        const totalUnpaidBillsAmount = billsList
          .filter(bill => bill.status === "UNPAID" || bill.status === "OVERDUE")
          .reduce((sum, bill) => sum + bill.amount, 0);
        
        // Если сумма неоплаченных счетов не совпадает с суммой долга, добавляем корректирующий счет
        const difference = debtAmount - totalUnpaidBillsAmount;
        
        if (difference > 0.01 && hasDebt) {
          // Есть дополнительная задолженность, которая не учтена в разбивке
          billsList.push({
            period: "Прочая задолженность",
            amount: difference,
            status: "OVERDUE",
            service: "Прочее",
          });
        }
        
        // 5. Если нет разбивки вообще, но есть задолженность, показываем её
        if (billsList.length === 0 && hasDebt) {
          billsList.push({
            period: "Задолженность",
            amount: debtAmount,
            status: "UNPAID",
            service: "К оплате",
          });
        }
        
        // Сортируем счета: сначала просроченные, потом неоплаченные, потом оплаченные
        billsList.sort((a, b) => {
          const statusOrder = { OVERDUE: 0, UNPAID: 1, PAID: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        
        console.log("Final bills list:", billsList);
        console.log("Total unpaid bills amount:", totalUnpaidBillsAmount, "Debt amount:", debtAmount, "CommonDuty:", commonDuty);
        
        setBills(billsList);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке счетов");
      }
    } catch (error: any) {
      console.error("Error fetching bills:", error);
      setError("Ошибка при загрузке данных счетов из 1С");
    } finally {
      setLoadingBills(false);
    }
  };

  const totalUnpaid = bills
    .filter((bill) => bill.status === "UNPAID" || bill.status === "OVERDUE")
    .reduce((sum, bill) => sum + bill.amount, 0);

  const totalPaid = bills
    .filter((bill) => bill.status === "PAID")
    .reduce((sum, bill) => sum + bill.amount, 0);

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Счета и оплата</h1>
        <p className="text-gray-600">Управление счетами за водоснабжение</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Выбор лицевого счета */}
      {accounts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Лицевые счета
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAccountId === account.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <p className="font-semibold">ЛС: {account.accountNumber}</p>
                    <p className="text-sm text-gray-600">{account.address}</p>
                    {account.name && (
                      <p className="text-xs text-gray-500 mt-1">{account.name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Сводка */}
      {selectedAccountId && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Сводка</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBills ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-600">Загрузка данных...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Неоплаченные счета</p>
                  <p className="text-2xl font-bold text-red-500">
                    {bills.filter((b) => b.status === "UNPAID" || b.status === "OVERDUE").length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Сумма к оплате</p>
                  <p className="text-2xl font-bold">
                    {totalUnpaid.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Оплаченные счета</p>
                  <p className="text-2xl font-bold text-green-500">
                    {bills.filter((b) => b.status === "PAID").length}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Итого к оплате */}
      {selectedAccountId && !loadingBills && accountData && (
        <Card className="mb-6 border-2 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Итого к оплате</p>
                <p className={`text-3xl font-bold ${
                  (() => {
                    const commonDuty = parseFloat(String(accountData.CommonDuty || accountData.commonDuty || "0").replace(/,/g, ".")) || 0;
                    const debtAmount = Math.abs(commonDuty);
                    return debtAmount > 0.01 ? "text-red-600" : "text-gray-900";
                  })()
                }`}>
                  {(() => {
                    const commonDuty = parseFloat(String(accountData.CommonDuty || accountData.commonDuty || "0").replace(/,/g, ".")) || 0;
                    const debtAmount = Math.abs(commonDuty);
                    return debtAmount.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  })()} ₽
                </p>
                {(() => {
                  const commonDuty = parseFloat(String(accountData.CommonDuty || accountData.commonDuty || "0").replace(/,/g, ".")) || 0;
                  const debtAmount = Math.abs(commonDuty);
                  if (debtAmount <= 0.01) {
                    return <p className="text-sm text-gray-600 mt-1">Нет задолженности</p>;
                  } else {
                    return <p className="text-sm text-red-600 mt-1">Требуется оплата</p>;
                  }
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список счетов */}
      {selectedAccountId && !loadingBills && (
        <div className="space-y-4">
          {bills.map((bill, index) => {
            const status = statusConfig[bill.status];
            const StatusIcon = status.icon;

            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Счет за {bill.period}</CardTitle>
                      {bill.service && (
                        <CardDescription className="mt-1">
                          Услуга: {bill.service}
                        </CardDescription>
                      )}
                      {bill.dueDate && (
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4" />
                          Срок оплаты: {new Date(bill.dueDate).toLocaleDateString("ru-RU")}
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold mb-2">
                        {bill.amount.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                      </p>
                      <div className={`flex items-center gap-2 ${status.className}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {bill.status === "UNPAID" || bill.status === "OVERDUE" ? (
                    <div className="flex gap-4">
                      <Button asChild>
                        <Link href={`/dashboard/receipts/view?accountId=${selectedAccountId}`}>
                          Оплатить онлайн
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/dashboard/receipts/view?accountId=${selectedAccountId}`}>
                          <Download className="h-4 w-4 mr-2" />
                          Скачать квитанцию
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Оплачено {bill.paidAt && new Date(bill.paidAt).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedAccountId && !loadingBills && bills.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>Нет счетов для отображения</p>
            <p className="text-sm text-gray-400 mt-2">
              Данные загружаются из системы 1С
            </p>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
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
