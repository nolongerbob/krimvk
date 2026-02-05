"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Droplet, Snowflake, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

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
  const password = searchParams.get("password");
  const region = searchParams.get("region");

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
    if (accountNumber && password && region) {
      fetchMeters();
    } else {
      setError("Отсутствуют необходимые параметры подключения");
      setLoading(false);
    }
  }, [accountNumber, password, region]);

  const fetchMeters = async () => {
    if (!accountNumber || !password || !region) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        accountNumber,
        password,
        region,
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
        accountNumber: accountNumber || "",
        password: password || "",
        region: region || "",
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
      <div className="container py-8 px-4">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Загрузка счетчиков...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Передача показаний</h1>
            <Button variant="outline" onClick={() => window.close()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Закрыть
            </Button>
          </div>
          <p className="text-gray-600">Лицевой счет: {accountNumber}</p>
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
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Счетчики холодной воды не найдены</p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {meters.map((meter) => (
              <Card key={meter.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Snowflake className="h-5 w-5 text-blue-500" />
                    {meter.serviceName || "Холодная вода"}
                  </CardTitle>
                  <CardDescription>
                    Прибор учета № {meter.serialNumber}
                    {meter.lastReading && (
                      <span className="ml-2">
                        • Последнее показание: <span className="font-medium">{meter.lastReading}</span> м³
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || submitting || Object.keys(readings).length === 0}
              size="lg"
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
