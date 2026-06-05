"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Droplet, Snowflake, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { adminContainerClass, adminFieldClass, adminOutlineBtnClass, adminPrimaryBtnClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

interface Meter {
  id: string;
  serialNumber: string;
  type: string;
  serviceName?: string;
  lastReading?: number | null;
}

export default function DirectAccountMetersPage() {
  const searchParams = useSearchParams();
  const accountNumber = searchParams.get("accountNumber");
  const token = searchParams.get("token");

  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Проверяем ограничения: показания можно передавать только с 6 по 25 число
  const today = new Date();
  const dayOfMonth = today.getDate();
  const canSubmit = dayOfMonth >= 6 && dayOfMonth <= 25;

  useEffect(() => {
    if (token) {
      fetchMeters();
    } else {
      setError("Отсутствует токен сессии прямого доступа");
      setLoading(false);
    }
  }, [token]);

  const fetchMeters = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        token,
      });

      const response = await fetch(`/api/admin/direct-account/meters?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const submissions = Object.entries(readings)
        .filter(([_, value]) => value && value.trim() !== "")
        .map(([meterId, value]) => ({
          meterId,
          reading: parseFloat(value),
        }));

      if (submissions.length === 0) {
        setError("Введите хотя бы одно показание");
        setSubmitting(false);
        return;
      }

      const params = new URLSearchParams({
        token: token || "",
      });

      const response = await fetch(`/api/admin/direct-account/submit-reading?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissions }),
      });

      if (response.ok) {
        setSuccess(true);
        setReadings({});
        // Перезагружаем счетчики чтобы обновить lastReading
        await fetchMeters();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при передаче показаний");
      }
    } catch (error: any) {
      console.error("Error submitting readings:", error);
      setError(`Ошибка при передаче показаний: ${error?.message || "Неизвестная ошибка"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={cn(adminContainerClass, "max-w-4xl")}>
        <div className="py-12 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-600">Загрузка счетчиков...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={cn(adminContainerClass, "max-w-4xl")}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Передача показаний</h1>
            <p className="text-sm text-slate-600">Лицевой счет: {accountNumber}</p>
          </div>
          <Button variant="outline" onClick={() => window.close()} className={adminOutlineBtnClass}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Закрыть
          </Button>
        </div>

        {!canSubmit && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Передача показаний возможна только с 6 по 25 число каждого месяца.
              <br />
              Сегодня {dayOfMonth} число - передача показаний {dayOfMonth < 6 ? "еще не доступна" : "уже закрыта"}.
            </AlertDescription>
          </Alert>
        )}

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
              Показания успешно переданы!
            </AlertDescription>
          </Alert>
        )}

        {meters.length === 0 ? (
          <DashboardCard>
            <DashboardCardBody className="py-12 text-center">
              <p className="text-slate-600">Счетчики холодной воды не найдены</p>
            </DashboardCardBody>
          </DashboardCard>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {meters.map((meter) => (
              <DashboardCard key={meter.id}>
                <DashboardCardBody>
                  <div className="mb-4 border-b border-slate-100 pb-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Snowflake className="h-5 w-5 text-blue-500" />
                      {meter.serviceName || "Холодная вода"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Прибор учета № {meter.serialNumber}
                      {meter.lastReading && (
                        <span className="ml-2">
                          • Последнее показание: <span className="font-medium">{meter.lastReading}</span> м³
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`reading-${meter.id}`}>Текущее показание (м³)</Label>
                    <Input
                      id={`reading-${meter.id}`}
                      type="number"
                      step="0.01"
                      min={meter.lastReading || 0}
                      placeholder="Введите показание"
                      value={readings[meter.id] || ""}
                      onChange={(e) =>
                        setReadings((prev) => ({
                          ...prev,
                          [meter.id]: e.target.value,
                        }))
                      }
                      disabled={!canSubmit || submitting}
                      className={adminFieldClass}
                    />
                  </div>
                </DashboardCardBody>
              </DashboardCard>
            ))}

            <Button
              type="submit"
              className={cn("w-full", adminPrimaryBtnClass)}
              disabled={!canSubmit || submitting || Object.keys(readings).length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Передача показаний...
                </>
              ) : (
                <>
                  <Droplet className="mr-2 h-4 w-4" />
                  Передать показания
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
