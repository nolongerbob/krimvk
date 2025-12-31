"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Droplet, 
  CreditCard, 
  FileText, 
  Wrench, 
  TrendingUp, 
  AlertCircle, 
  Truck,
  Wallet,
  Loader2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";


interface Account {
  id: string;
  accountNumber: string;
  address: string;
  name: string | null;
  region: string | null;
}

interface AccountData {
  balance: number; // CommonDuty - итоговая задолженность
  paid: number; // CommonPayment - оплачено в текущем месяце
  charged: number; // ChargesAndPayments[0].Charge - начислено в текущем месяце
  accountNumber: string;
  address: string;
  name: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [stats, setStats] = useState({
    unpaidBills: 0,
    totalAmount: 0,
    metersCount: 0,
    activeApplications: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }
    if (status === "authenticated") {
      fetchAccounts();
      fetchStats();
    }
  }, [status, router]);

  // Обновляем статистику при монтировании компонента (когда пользователь возвращается на дашборд)
  useEffect(() => {
    if (status === "authenticated") {
      // Обновляем статистику сразу и через небольшую задержку
      fetchStats();
      const timer = setTimeout(() => {
        fetchStats();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Обновляем статистику при возврате с других страниц (например, после создания заявки)
  useEffect(() => {
    if (status === "authenticated" && searchParams.get("refresh") === "true") {
      fetchStats();
      // Убираем параметр из URL
      router.replace("/dashboard", { scroll: false });
    }
  }, [status, searchParams, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats", {
        cache: "no-store", // Не кэшируем запрос
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Stats data received:", data); // Для отладки
        setStats({
          unpaidBills: data.unpaidBills || 0,
          totalAmount: data.totalAmount || 0,
          metersCount: data.metersCount || 0,
          activeApplications: data.activeApplications || 0,
        });
      } else {
        const errorData = await response.json();
        console.error("Error fetching stats:", errorData);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchAccountData();
    }
  }, [selectedAccountId]);

  // Обновляем статистику периодически, при фокусе страницы и при событии обновления
  useEffect(() => {
    if (status === "authenticated") {
      // Обновляем статистику каждые 10 секунд (чаще для быстрого обновления)
      const interval = setInterval(() => {
        fetchStats();
      }, 10000);

      // Обновляем статистику при возврате на страницу
      const handleFocus = () => {
        fetchStats();
      };
      window.addEventListener("focus", handleFocus);

      // Обновляем статистику при событии обновления (например, после создания заявки)
      const handleStatsUpdate = () => {
        fetchStats();
      };
      window.addEventListener("stats-update", handleStatsUpdate);

      // Обновляем статистику при видимости страницы (когда пользователь возвращается на вкладку)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchStats();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("stats-update", handleStatsUpdate);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [status]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        const accountsList = data.accounts || [];
        setAccounts(accountsList);
        
        // Автоматически выбираем первый счет
        if (accountsList.length > 0 && !selectedAccountId) {
          const firstAccount = accountsList[0];
          setSelectedAccountId(firstAccount.id);
        }
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountData = async () => {
    if (!selectedAccountId) return;
    
    setLoadingData(true);
    try {
      const response = await fetch(`/api/1c/get-data?accountId=${selectedAccountId}`);
      if (response.ok) {
        const data = await response.json();
        // Извлекаем финансовые данные из ответа 1С согласно структуре старого сайта
        const responseData = data.data || data;
        
        // CommonDuty - итоговая задолженность (к оплате) - это и есть баланс
        const balance = responseData?.CommonDuty || responseData?.commonDuty || 0;
        
        // CommonPayment - сумма оплат в текущем месяце
        const paid = responseData?.CommonPayment || responseData?.commonPayment || responseData?.CommonPayment || 0;
        
        // ChargesAndPayments[0].Charge - начислено в текущем месяце
        const charges = responseData?.ChargesAndPayments || responseData?.chargesAndPayments || [];
        const charged = charges.length > 0 
          ? (charges[0]?.Charge || charges[0]?.charge || 0)
          : 0;
        
        // Функция для правильного парсинга числа (может быть с запятой или точкой)
        const parseAmount = (value: string | number): number => {
          if (typeof value === "number") return value;
          if (!value) return 0;
          // Заменяем запятую на точку для parseFloat и убираем пробелы
          const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
          const parsed = parseFloat(normalized);
          const result = isNaN(parsed) ? 0 : parsed;
          
          // Отладка
          if (process.env.NODE_ENV === "development") {
            console.log("parseAmount:", { original: value, normalized, parsed, result });
          }
          
          return result;
        };
        
        const account = accounts.find(a => a.id === selectedAccountId);
        
        const parsedBalance = parseAmount(balance);
        const parsedPaid = parseAmount(paid);
        const parsedCharged = parseAmount(charged);
        
        // Отладка
        if (process.env.NODE_ENV === "development") {
          console.log("Balance data:", {
            rawBalance: balance,
            parsedBalance,
            formattedBalance: parsedBalance.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            rawPaid: paid,
            parsedPaid,
            rawCharged: charged,
            parsedCharged,
          });
        }
        
        setAccountData({
          balance: parsedBalance,
          paid: parsedPaid,
          charged: parsedCharged,
          accountNumber: account?.accountNumber || "",
          address: account?.address || "",
          name: account?.name || null,
        });
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container py-8 px-4 max-w-7xl">
        {/* Header with Balance and Account */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Личный кабинет
              </h1>
              <p className="text-gray-600">
                Добро пожаловать, {session.user?.name || session.user?.email}!
              </p>
            </div>
          </div>

          {/* Balance and Account Card */}
          {accounts.length > 0 ? (
            <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
              <CardContent className="p-6">
                {/* Account Selector if multiple accounts */}
                {accounts.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Выберите лицевой счет
                    </label>
                    <select
                      value={selectedAccountId || ""}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
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

                <div className="flex items-center gap-6">
                  <div className="p-4 bg-blue-100 rounded-xl">
                    <Wallet className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Баланс</p>
                        {loadingData ? (
                          <div className="h-10 w-40 bg-gray-200 animate-pulse rounded mb-4"></div>
                        ) : (
                          <p className={`text-4xl font-bold ${
                            accountData?.balance !== undefined
                              ? accountData.balance < 0
                                ? "text-red-600" // Отрицательный баланс (долг) - красный
                                : accountData.balance === 0
                                ? "text-green-600" // Нулевой баланс - зеленый
                                : accountData.balance > 0
                                ? "text-red-600" // Положительный баланс (тоже долг в 1С) - красный
                                : "text-gray-900"
                              : "text-gray-900"
                          }`}>
                            {accountData?.balance !== undefined 
                              ? `${accountData.balance.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
                              : "— ₽"}
                          </p>
                        )}
                      </div>
                      {accountData && selectedAccountId && (accountData.balance < 0 || accountData.balance > 0) && (
                        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                          <Link href={`/dashboard/receipts/view?accountId=${selectedAccountId}`}>Оплатить</Link>
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
                        
                        {/* Дополнительная финансовая информация */}
                        {(accountData.charged > 0 || accountData.paid > 0) && (
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Начислено в текущем месяце</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {accountData.charged.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Оплачено в текущем месяце</p>
                              <p className="text-sm font-semibold text-green-600">
                                {accountData.paid.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
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
          ) : (
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
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/bills">
            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Неоплаченные счета</CardTitle>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="text-3xl font-bold">{stats.unpaidBills}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  На сумму {stats.totalAmount.toLocaleString("ru-RU")} ₽
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/meters">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Счетчики</CardTitle>
                <Droplet className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="text-3xl font-bold">{stats.metersCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Зарегистрировано
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/applications">
            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Активные заявки</CardTitle>
                <FileText className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="text-3xl font-bold">{stats.activeApplications}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  В обработке
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Droplet className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Показания счетчиков</CardTitle>
              </div>
              <CardDescription>Подать показания счетчиков воды</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard/meters">Подать показания</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Счета и оплата</CardTitle>
              </div>
              <CardDescription>Просмотр и оплата счетов</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link href="/dashboard/bills">Перейти к счетам</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Квитанции</CardTitle>
              </div>
              <CardDescription>Скачать квитанции на оплату</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link href="/dashboard/receipts">Скачать квитанцию</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>История платежей</CardTitle>
              </div>
              <CardDescription>Просмотр истории платежей</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link href="/dashboard/history">История</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wrench className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Заказать услугу</CardTitle>
              </div>
              <CardDescription>Подать заявку на услуги</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link href="/services">Выбрать услугу</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Задать вопрос</CardTitle>
              </div>
              <CardDescription>Задать вопрос службе поддержки</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-end">
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link href="/dashboard/questions">Задать вопрос</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
