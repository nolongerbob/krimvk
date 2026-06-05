"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft, History } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { adminContainerClass, adminOutlineBtnClass, adminSectionLabelClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

interface MeterHistoryItem {
  NumberOfDevice?: string;
  DeviceNumber?: string;
  Number?: string;
  Reading?: number;
  ReadingDate?: string;
  Date?: string;
  Value?: number;
  Service?: string;
  Volume?: number;
  PastReading?: number;
  DateOfHistory?: string;
}

export default function DirectAccountMeterHistoryPage() {
  const searchParams = useSearchParams();
  const accountNumber = searchParams.get("accountNumber");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meterHistory, setMeterHistory] = useState<Record<string, MeterHistoryItem[]>>({});

  useEffect(() => {
    if (token) {
      fetchMeterHistory();
    } else {
      setError("Отсутствует токен сессии прямого доступа");
      setLoading(false);
    }
  }, [token]);

  const fetchMeterHistory = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // Получаем историю за последние 12 месяцев
      const today = new Date();
      const dateTo = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
      const dateFrom = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      const dateFromStr = `${String(dateFrom.getDate()).padStart(2, '0')}.${String(dateFrom.getMonth() + 1).padStart(2, '0')}.${dateFrom.getFullYear()}`;

      const params = new URLSearchParams({
        token,
        dateFrom: dateFromStr,
        dateTo: dateTo,
      });

      const response = await fetch(`/api/admin/direct-account/meter-history?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();

        let historyItems: MeterHistoryItem[] = [];

        if (data.history) {
          const historyData: any = data.history.History || data.history.history || data.history;

          // Если History - это объект (ключи = timestamp, значения = массивы)
          if (historyData && typeof historyData === 'object' && !Array.isArray(historyData)) {
            Object.keys(historyData).forEach((timestamp) => {
              const readingsForDate: any = historyData[timestamp];
              if (Array.isArray(readingsForDate)) {
                readingsForDate.forEach((item: any) => {
                  historyItems.push({
                    ...item,
                    ReadingDate: new Date(parseInt(timestamp) * 1000).toISOString(),
                    Date: new Date(parseInt(timestamp) * 1000).toISOString(),
                  });
                });
              }
            });
          }
          // Если History - это массив
          else if (Array.isArray(historyData)) {
            historyItems = historyData as MeterHistoryItem[];
          }
          // Если data.history сам по себе массив
          else if (Array.isArray(data.history)) {
            historyItems = data.history as MeterHistoryItem[];
          }
        }
        // Если data сам по себе массив
        else if (Array.isArray(data)) {
          historyItems = data as MeterHistoryItem[];
        }

        const groupedHistory: Record<string, MeterHistoryItem[]> = {};

        if (Array.isArray(historyItems)) {
          historyItems.forEach((item: MeterHistoryItem) => {
            const deviceNumber = String(
              item.NumberOfDevice ||
              item.DeviceNumber ||
              item.Number ||
              ""
            );

            if (deviceNumber && deviceNumber !== "undefined" && deviceNumber !== "null") {
              const normalizedKey = String(deviceNumber).trim();

              if (!groupedHistory[normalizedKey]) {
                groupedHistory[normalizedKey] = [];
              }

              // Избегаем дубликатов
              const exists = groupedHistory[normalizedKey].some(existing => {
                const existingDate = existing.ReadingDate || existing.Date;
                const itemDate = item.ReadingDate || item.Date;
                const existingReading = existing.Reading || existing.Value;
                const itemReading = item.Reading || item.Value;
                return existingDate === itemDate && existingReading === itemReading;
              });

              if (!exists) {
                groupedHistory[normalizedKey].push(item);
              }
            }
          });
        }

        // Сортируем историю по дате (новые первыми)
        Object.keys(groupedHistory).forEach((key) => {
          groupedHistory[key].sort((a, b) => {
            const dateA = new Date(a.ReadingDate || a.Date || 0).getTime();
            const dateB = new Date(b.ReadingDate || b.Date || 0).getTime();
            return dateB - dateA;
          });
        });

        setMeterHistory(groupedHistory);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке истории показаний");
      }
    } catch (error: any) {
      console.error("Error fetching meter history:", error);
      setError(`Ошибка при загрузке истории показаний: ${error?.message || "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-slate-600">Загрузка истории показаний...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={cn(adminContainerClass, "max-w-4xl")}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">История показаний</h1>
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

        {Object.keys(meterHistory).length === 0 ? (
          <DashboardCard>
            <DashboardCardBody className="py-12 text-center">
              <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">История показаний отсутствует</p>
            </DashboardCardBody>
          </DashboardCard>
        ) : (
          <DashboardCard>
            <DashboardCardBody>
              <p className={cn(adminSectionLabelClass, "mb-2 flex items-center gap-2")}>
                <History className="h-4 w-4" />
                История показаний счетчиков
              </p>
              <p className="mb-4 text-sm text-slate-600">
                Предыдущие показания счетчиков за последние 12 месяцев
              </p>
              <div className="space-y-6">
                {Object.entries(meterHistory).map(([deviceNumber, history]) => {
                  if (!history || history.length === 0) return null;

                  // Получаем имя сервиса из первого элемента
                  const serviceName = history[0]?.Service || `Счетчик № ${deviceNumber}`;

                  return (
                    <div key={deviceNumber} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h4 className="text-sm font-semibold mb-3">
                        {serviceName}
                        <span className="text-slate-500 font-normal ml-2">• Прибор учета № {deviceNumber}</span>
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {history.map((item, index) => {
                          const readingValue = item.Reading || item.Value;
                          const readingDate = item.ReadingDate || item.Date || item.DateOfHistory;
                          if (readingValue === undefined && !readingDate) return null;

                          return (
                            <div key={index} className="flex items-center justify-between bg-slate-50 p-3 text-sm">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {readingValue !== undefined && readingValue !== null
                                        ? `${parseFloat(String(readingValue)).toLocaleString("ru-RU", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })} м³`
                                        : "—"}
                                    </p>
                                  </div>
                                  {item.Volume !== undefined && item.Volume !== null && (
                                    <div className="text-right ml-4">
                                      <p className="text-xs text-slate-600">Объем:</p>
                                      <p className="text-sm font-medium">
                                        {parseFloat(String(item.Volume)).toLocaleString("ru-RU", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })} м³
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {readingDate && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {new Date(readingDate).toLocaleDateString("ru-RU", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </p>
                                )}
                                {item.PastReading !== undefined && item.PastReading !== null && (
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Предыдущее: {parseFloat(String(item.PastReading)).toLocaleString("ru-RU", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })} м³
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Показано последних {Math.min(history.length, 100)} показаний
                      </p>
                    </div>
                  );
                })}
              </div>
            </DashboardCardBody>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
