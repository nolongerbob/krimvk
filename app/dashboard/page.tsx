"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Droplet, 
  CreditCard, 
  FileText, 
  Wrench, 
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardTour from "@/components/DashboardTour";
import { useDashboardOverview } from "@/hooks/use-dashboard-overview";
import { useDashboardEmailVerification } from "@/hooks/use-dashboard-email-verification";
import { EmailVerificationBanner } from "@/components/dashboard/EmailVerificationBanner";
import { DashboardBalanceCard } from "@/components/dashboard/DashboardBalanceCard";
import { DashboardStatsGrid } from "@/components/dashboard/DashboardStatsGrid";
import type { DashboardAccount, DashboardAccountData } from "@/lib/dashboard-types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<DashboardAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [stats, setStats] = useState({
    unpaidBills: 0,
    totalAmount: 0,
    metersCount: 0,
    activeApplications: 0,
  });
  const [overviewEmailVerified, setOverviewEmailVerified] = useState<boolean | null>(null);
  const [overviewEmail, setOverviewEmail] = useState("");
  const [accountDataError, setAccountDataError] = useState<string | null>(null);
  const { fetchOverview } = useDashboardOverview();
  const skipAccountRefetch = useRef(true);

  const {
    emailVerified,
    userEmail,
    newEmail,
    setNewEmail,
    emailMessage,
    resendingEmail,
    changingEmail,
    handleResendVerification,
    handleChangeEmail,
    fetchUserEmailStatus,
  } = useDashboardEmailVerification({
    enabled: status === "authenticated",
    emailVerifiedFromOverview: overviewEmailVerified,
    overviewEmail,
  });

  const applyOverview = (data: Awaited<ReturnType<typeof fetchOverview>>) => {
    setStats({
      unpaidBills: data.stats.unpaidBills || 0,
      totalAmount: data.stats.totalAmount || 0,
      metersCount: data.stats.metersCount || 0,
      activeApplications: data.stats.activeApplications || 0,
    });
    setAccounts(data.accounts || []);
    setOverviewEmailVerified(data.profile.emailVerified ? true : false);
    setOverviewEmail(data.profile.email || "");
    if (data.selectedAccountId) {
      setSelectedAccountId(data.selectedAccountId);
    }
    if (data.accountData) {
      setAccountData(data.accountData);
      setAccountDataError(null);
    }
  };

  const loadOverview = async (accountId?: string | null) => {
    try {
      const data = await fetchOverview(accountId ?? selectedAccountId);
      applyOverview(data);
    } catch {
      setAccountDataError("Не удалось загрузить данные личного кабинета.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }
    if (status === "authenticated") {
      setLoading(true);
      loadOverview();
    }
  }, [status, router]);

  // Дополнительная проверка сессии при загрузке страницы
  // Особенно важно после подтверждения email
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          credentials: 'include', // Важно для передачи cookies
        });
        const data = await response.json();
        
        if (process.env.NODE_ENV === 'development') {
          console.log("[Dashboard] Session check result:", data);
        }
        
        if (!data.authenticated && status === "authenticated") {
          // Сессия не найдена на сервере, но клиент думает что авторизован
          // Это может произойти после подтверждения email, если cookie не применилась
          console.log("[Dashboard] Session mismatch, refreshing...");
          // Даем небольшую задержку для применения cookie
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } catch (error) {
        console.error("[Dashboard] Error checking session:", error);
      }
    };
    
    // Проверяем сессию при загрузке и после подтверждения email
    if (status === "authenticated" || searchParams.get("emailVerified") === "true") {
      // Небольшая задержка, чтобы cookie успела примениться
      setTimeout(() => {
        checkSession();
      }, 1000);
    }
  }, [status, searchParams]);

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

  // Обновляем статус email при возврате после подтверждения
  useEffect(() => {
    if (status === "authenticated" && searchParams.get("emailVerified") === "true") {
      // Принудительно обновляем статус email после подтверждения
      // Добавляем небольшую задержку, чтобы БД успела обновиться
      setTimeout(() => {
        fetchUserEmailStatus(true); // force = true для обхода кэша
        // Убираем параметр из URL
        router.replace("/dashboard", { scroll: false });
      }, 500);
    }
  }, [status, searchParams, router]);

  const fetchStats = async () => {
    await loadOverview(selectedAccountId);
  };

  useEffect(() => {
    if (!selectedAccountId || status !== "authenticated") return;
    if (skipAccountRefetch.current) {
      skipAccountRefetch.current = false;
      return;
    }
    setLoadingData(true);
    loadOverview(selectedAccountId).finally(() => setLoadingData(false));
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
        {/* Email Verification Banner */}
        {emailVerified === false && (
          <EmailVerificationBanner
            userEmail={userEmail}
            emailMessage={emailMessage}
            resendingEmail={resendingEmail}
            changingEmail={changingEmail}
            newEmail={newEmail}
            onNewEmailChange={setNewEmail}
            onResend={handleResendVerification}
            onChangeEmail={handleChangeEmail}
          />
        )}

        {/* Header with Balance and Account */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div data-tour-id="tour-welcome">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Личный кабинет
              </h1>
              <p className="text-gray-600">
                Добро пожаловать, {session.user?.name || session.user?.email}!
              </p>
            </div>
          </div>

          {/* Balance and Account Card */}
          <div data-tour-id="tour-balance">
            <DashboardBalanceCard
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccount={setSelectedAccountId}
              accountData={accountData}
              loadingData={loadingData}
              accountDataError={accountDataError}
            />
          </div>
        </div>

        <DashboardStatsGrid stats={stats} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" data-tour-id="tour-quick">
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

        <DashboardTour />
      </div>
    </div>
  );
}
