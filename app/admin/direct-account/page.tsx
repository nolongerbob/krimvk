"use client";

import { useState } from "react";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { dashboardTileClass } from "@/components/dashboard/dashboard-styles";
import { adminContainerClass, adminFieldClass, adminOutlineBtnClass, adminPrimaryBtnClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Receipt, Droplet, CreditCard, AlertCircle, FileText, History } from "lucide-react";
import Link from "next/link";
import { ONE_C_REGION_OPTIONS } from "@/lib/1c-regions";

// Парсер сумм из 1С (пробелы, запятые) — как в ЛК и квитанции
function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export default function DirectAccountPage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAccountData(null);
    setIsConnected(false);

    if (!region) {
      setError("Выберите район лицевого счёта");
      setLoading(false);
      return;
    }

    try {
      // Проверяем подключение и получаем временный токен серверной сессии
      const response = await fetch("/api/admin/direct-account/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, password, region }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccountData(data.data);
        setSessionToken(data.token || null);
        setIsConnected(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при подключении к лицевому счету");
      }
    } catch (error: any) {
      console.error("Error connecting to account:", error);
      setError(`Ошибка подключения: ${error?.message || "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAccountNumber("");
    setPassword("");
    setRegion("");
    setSessionToken(null);
    setAccountData(null);
    setIsConnected(false);
    setError(null);
  };

  const openReceipt = () => {
    if (!sessionToken) return;
    // Открываем квитанцию в новом окне с параметрами лицевого счета
    const params = new URLSearchParams({ token: sessionToken });
    window.open(`/admin/direct-account/receipt?${params.toString()}`, "_blank");
  };

  const openMeters = () => {
    if (!sessionToken) return;
    // Открываем передачу показаний в новом окне
    const params = new URLSearchParams({ token: sessionToken });
    window.open(`/admin/direct-account/meters?${params.toString()}`, "_blank");
  };

  const openPaymentHistory = () => {
    if (!sessionToken) return;
    // Открываем историю платежей в новом окне
    const params = new URLSearchParams({ token: sessionToken });
    window.open(`/admin/direct-account/payment-history?${params.toString()}`, "_blank");
  };

  const openMeterHistory = () => {
    if (!sessionToken) return;
    // Открываем историю показаний в новом окне
    const params = new URLSearchParams({ token: sessionToken });
    window.open(`/admin/direct-account/meter-history?${params.toString()}`, "_blank");
  };

  return (
    <div className={cn(adminContainerClass, "max-w-4xl")}>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          Работа с лицевым счетом
        </h1>
        <p className="text-sm text-slate-600">
          Введите данные лицевого счета для доступа к информации и управлению
        </p>
      </div>

      {!isConnected ? (
        <DashboardCard>
          <DashboardCardBody>
            <div className="mb-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Key className="h-5 w-5" />
                Подключение к лицевому счету
              </h2>
              <p className="text-sm text-slate-500">
                Введите номер лицевого счета и пароль для доступа к данным 1С
              </p>
            </div>
            <form onSubmit={handleConnect} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Номер лицевого счета</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Введите номер л/с"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  disabled={loading}
                  className={adminFieldClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль от л/с"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={adminFieldClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Регион</Label>
                <Select value={region} onValueChange={setRegion} disabled={loading}>
                  <SelectTrigger id="region" className={adminFieldClass}>
                    <SelectValue placeholder="Выберите район" />
                  </SelectTrigger>
                  <SelectContent>
                    {ONE_C_REGION_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className={cn("w-full", adminPrimaryBtnClass)} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Подключиться
                  </>
                )}
              </Button>
            </form>
          </DashboardCardBody>
        </DashboardCard>
      ) : (
        <div className="space-y-6">
          <DashboardCard>
            <DashboardCardBody>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Key className="h-5 w-5 text-emerald-600" />
                  Подключено к л/с: {accountNumber}
                </span>
                <Button variant="outline" size="sm" className={adminOutlineBtnClass} onClick={handleDisconnect}>
                  Отключиться
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Адрес</p>
                  <p className="font-medium text-slate-900">{accountData?.Address || accountData?.address || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Абонент</p>
                  <p className="font-medium text-slate-900">{accountData?.LSName || accountData?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {(() => {
                      const balance = parseAmount(accountData?.CommonDuty ?? accountData?.commonDuty ?? "0");
                      if (balance > 0.01) return "Задолженность (к оплате)";
                      if (balance < -0.01) return "Переплата";
                      return "Баланс";
                    })()}
                  </p>
                  <p className={`font-medium text-lg ${
                    (() => {
                      const balance = parseAmount(accountData?.CommonDuty ?? accountData?.commonDuty ?? "0");
                      if (balance > 0.01) return "text-red-600";
                      if (balance < -0.01) return "text-green-600";
                      return "text-gray-900";
                    })()
                  }`}>
                    {parseAmount(accountData?.CommonDuty ?? accountData?.commonDuty ?? "0")
                      .toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    ₽
                  </p>
                </div>
              </div>
            </DashboardCardBody>
          </DashboardCard>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { onClick: openReceipt, icon: Receipt, title: "Квитанция", desc: "Просмотр и печать квитанции с полными данными", iconClass: "text-blue-600" },
              { onClick: openMeters, icon: Droplet, title: "Передача показаний", desc: "Передать показания счетчиков воды", iconClass: "text-blue-600" },
              { onClick: openPaymentHistory, icon: CreditCard, title: "История платежей", desc: "Просмотр истории платежей по счету", iconClass: "text-slate-600" },
              { onClick: openMeterHistory, icon: History, title: "История показаний", desc: "Просмотр истории показаний счетчиков", iconClass: "text-slate-600" },
            ].map(({ onClick, icon: Icon, title, desc, iconClass }) => (
              <button
                key={title}
                type="button"
                onClick={onClick}
                className={cn(dashboardTileClass, "flex h-full flex-col gap-3 p-5 text-left")}
              >
                <Icon className={cn("h-5 w-5 shrink-0", iconClass)} strokeWidth={1.75} />
                <div className="flex min-h-0 flex-1 flex-col gap-1">
                  <p className="text-base font-semibold leading-snug text-slate-900">{title}</p>
                  <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
