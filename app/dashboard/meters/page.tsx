"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplet, Thermometer, Snowflake, AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddAccountForm } from "@/components/AddAccountForm";

interface Meter {
  id: string;
  serialNumber: string;
  type: string;
  address: string;
  lastReading: number | null;
  lastReadingDate: string | null;
  serviceName?: string;
}

interface Account {
  id: string;
  accountNumber: string;
  address: string;
  name: string | null;
  phone: string | null;
  meters: Meter[];
}

const typeConfig = {
  горячая: { label: "Горячая вода", icon: Thermometer, color: "text-red-500" },
  холодная: { label: "Холодная вода", icon: Snowflake, color: "text-blue-500" },
};

export default function MetersPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Проверяем ограничения: показания можно передавать только с 6 по 25 число
  const today = new Date();
  const dayOfMonth = today.getDate();
  const canSubmit = dayOfMonth >= 6 && dayOfMonth <= 25;

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchMetersForAccount(selectedAccountId);
    } else {
      setMeters([]);
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        // Автоматически выбираем первый счет, если есть
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

  const fetchMetersForAccount = async (accountId: string) => {
    try {
      // Получаем счетчики из 1С API
      const response = await fetch(`/api/1c/meters?accountId=${accountId}`);
      if (response.ok) {
        const data = await response.json();
        // Фильтруем только счетчики холодной воды
        const coldWaterMeters = (data.meters || []).filter(
          (m: Meter) => m.type === "холодная" || m.type === "cold"
        );
        setMeters(coldWaterMeters);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке счетчиков");
      }
    } catch (error: any) {
      console.error("Error fetching meters:", error);
      setError(`Ошибка при загрузке счетчиков: ${error?.message || "Неизвестная ошибка"}`);
    }
  };

  const handleReadingChange = (meterId: string, value: string) => {
    setReadings({ ...readings, [meterId]: value });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Валидация
      const meterIds = Object.keys(readings);
      if (meterIds.length === 0) {
        setError("Введите показания хотя бы для одного счетчика");
        setSubmitting(false);
        return;
      }

      for (const meterId of meterIds) {
        const value = parseFloat(readings[meterId]);
        const meter = meters.find((m) => m.id === meterId);
        
        if (isNaN(value) || value < 0) {
          setError("Показания должны быть положительным числом");
          setSubmitting(false);
          return;
        }

        if (meter && meter.lastReading !== null && value < meter.lastReading) {
          setError(`Показания для счетчика ${meter.serialNumber} не могут быть меньше предыдущих (${meter.lastReading} м³)`);
          setSubmitting(false);
          return;
        }
      }

      // Отправляем показания через 1С API
      const submitPromises = Object.entries(readings).map(async ([meterId, value]) => {
        const meter = meters.find((m) => m.id === meterId);
        if (!meter || !selectedAccountId) return;

        const response = await fetch("/api/1c/submit-reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: selectedAccountId,
            deviceNumber: meter.id, // Номер счетчика из 1С
            reading: parseFloat(value),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Ошибка при отправке показаний для счетчика ${meter.serialNumber}`);
        }

        return await response.json();
      });

      await Promise.all(submitPromises);

      setSuccess(true);
      setReadings({});
      setTimeout(() => {
        router.refresh();
        if (selectedAccountId) {
          fetchMetersForAccount(selectedAccountId);
        }
      }, 1500);
    } catch (error) {
      console.error("Error submitting readings:", error);
      setError("Ошибка при отправке показаний");
    } finally {
      setSubmitting(false);
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
    <div className="container py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Передача показаний счетчиков</h1>
        <p className="text-gray-600">Выберите лицевой счет и передайте показания счетчиков холодной воды</p>
        {!canSubmit && (
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Показания можно передавать только с 6 по 25 число каждого месяца (включительно)
            </AlertDescription>
          </Alert>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Показания успешно отправлены!
          </AlertDescription>
        </Alert>
      )}

      {/* Форма добавления лицевого счета */}
      <div className="mb-6">
        <AddAccountForm onAccountAdded={fetchAccounts} />
      </div>

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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">ЛС: {account.accountNumber}</p>
                      <p className="text-sm text-gray-600">{account.address}</p>
                      {account.name && (
                        <p className="text-xs text-gray-500 mt-1">{account.name}</p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {account.meters.length} счетчик(ов)
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Форма передачи показаний */}
      {selectedAccountId && meters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">У выбранного лицевого счета нет счетчиков холодной воды</p>
            <p className="text-sm text-gray-400">
              Обратитесь в службу поддержки для регистрации счетчиков
            </p>
          </CardContent>
        </Card>
      ) : selectedAccountId && meters.length > 0 ? (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 mb-6">
            {meters.map((meter) => {
              const config = typeConfig[meter.type as keyof typeof typeConfig] || {
                label: meter.type,
                icon: Droplet,
                color: "text-gray-500",
              };
              const Icon = config.icon;
              const lastReading = meter.lastReading;
              const lastReadingDate = meter.lastReadingDate;

              return (
                <Card key={meter.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${config.color}`} />
                      <div>
                        <CardTitle className="text-lg">{config.label}</CardTitle>
                        <CardDescription>
                          Заводской номер: {meter.serialNumber}
                          {meter.serviceName && ` • ${meter.serviceName}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Адрес установки</p>
                      <p className="text-sm font-medium">{meter.address}</p>
                    </div>
                    
                    {lastReading !== null && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Последние показания</p>
                        <p className="text-lg font-semibold">{lastReading.toLocaleString("ru-RU")} м³</p>
                        {lastReadingDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(lastReadingDate).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                        {meter.serviceName && (
                          <p className="text-xs text-gray-500 mt-1">
                            Услуга: {meter.serviceName}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor={`meter-${meter.id}`} className="text-sm font-medium">
                        Текущие показания (м³) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`meter-${meter.id}`}
                        type="number"
                        step="0.01"
                        min={lastReading !== null ? lastReading : 0}
                        value={readings[meter.id] || ""}
                        onChange={(e) => handleReadingChange(meter.id, e.target.value)}
                        placeholder={lastReading !== null ? `Не менее ${lastReading}` : "Введите показания"}
                        className="mt-1"
                        required
                        disabled={!canSubmit}
                      />
                      {lastReading !== null && (
                        <p className="text-xs text-gray-500 mt-1">
                          Минимальное значение: {lastReading} м³
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="pt-6">
              <Button
                type="submit"
                disabled={submitting || Object.keys(readings).length === 0 || !canSubmit}
                className="w-full"
                size="lg"
              >
                {submitting ? "Отправка..." : "Отправить показания"}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-4">
                Проверьте правильность введенных показаний перед отправкой
              </p>
            </CardContent>
          </Card>
        </form>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">У вас нет лицевых счетов</p>
            <p className="text-sm text-gray-400 mb-6">
              Добавьте лицевой счет, чтобы начать передавать показания счетчиков
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
