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
  const [meterHistory, setMeterHistory] = useState<Record<string, MeterHistoryItem[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasCurrentMonthReading, setHasCurrentMonthReading] = useState<Record<string, boolean>>({});
  
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
      // История загружается внутри fetchMetersForAccount после загрузки счетчиков
    } else {
      setMeters([]);
      setMeterHistory({});
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
        
        // После загрузки счетчиков загружаем историю
        // Используем setTimeout, чтобы убедиться, что состояние meters обновилось
        setTimeout(() => {
          fetchMeterHistory(accountId);
        }, 300);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке счетчиков");
      }
    } catch (error: any) {
      console.error("Error fetching meters:", error);
      setError(`Ошибка при загрузке счетчиков: ${error?.message || "Неизвестная ошибка"}`);
    }
  };

  const fetchMeterHistory = async (accountId: string) => {
    setLoadingHistory(true);
    try {
      // Получаем историю за последние 12 месяцев для полной картины
      const today = new Date();
      const dateTo = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
      const dateFrom = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      const dateFromStr = `${String(dateFrom.getDate()).padStart(2, '0')}.${String(dateFrom.getMonth() + 1).padStart(2, '0')}.${dateFrom.getFullYear()}`;
      
      const response = await fetch(`/api/1c/meter-history?accountId=${accountId}&dateFrom=${dateFromStr}&dateTo=${dateTo}`);
      if (response.ok) {
        const data = await response.json();
        
        // Логируем для отладки
        if (process.env.NODE_ENV === 'development') {
          console.log('[Meters] History response:', data);
          console.log('[Meters] History data structure:', {
            hasHistory: !!data.history,
            historyType: typeof data.history,
            historyKeys: data.history ? Object.keys(data.history) : [],
          });
        }
        
        // На старом сайте ответ содержит поле History
        // Структура: $response->History - это объект, где ключи = timestamp (дата), значения = массивы показаний
        // Строки 378-395 старого PHP кода: 
        //   if($response->History) {
        //     $the_history = $response->History;
        //     $the_history = (array)$the_history;
        //     arsort($the_history); // Сортировка по дате (обратная)
        //     foreach($the_history as $m => $n){ // $m - timestamp, $n - массив показаний
        //       foreach($n as $k => $res){
        //         $out['results'][$l][$k]['NumberOfDevice'] = $res->NumberOfDevice;
        //         $out['results'][$l][$k]['Reading'] = $res->Reading;
        //         ...
        //       }
        //     }
        //   }
        let historyItems: MeterHistoryItem[] = [];
        
        if (data.history) {
          const historyData = data.history.History || data.history.history || data.history;
          
          // Если History - это объект (ключи = timestamp, значения = массивы)
          if (historyData && typeof historyData === 'object' && !Array.isArray(historyData)) {
            // Преобразуем объект в плоский массив, как на старом сайте
            Object.keys(historyData).forEach((timestamp) => {
              const readingsForDate = historyData[timestamp];
              if (Array.isArray(readingsForDate)) {
                readingsForDate.forEach((item: any) => {
                  // Добавляем дату из timestamp
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
            historyItems = historyData;
          }
          // Если data.history сам по себе массив
          else if (Array.isArray(data.history)) {
            historyItems = data.history;
          }
        }
        // Если data сам по себе массив
        else if (Array.isArray(data)) {
          historyItems = data;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[Meters] History items count:', historyItems.length);
          console.log('[Meters] First history item:', historyItems[0]);
        }
        
        const groupedHistory: Record<string, MeterHistoryItem[]> = {};
        
        // Проверяем, что historyItems - это массив перед использованием forEach
        if (Array.isArray(historyItems)) {
          historyItems.forEach((item: MeterHistoryItem) => {
            // На старом сайте используется NumberOfDevice
            // Важно: meter.id из API /api/1c/meters соответствует NumberOfDevice из 1С
            // Поля из старого сайта: NumberOfDevice, Reading, Service, Volume, PastReading
            const deviceNumber = String(
              item.NumberOfDevice || 
              item.DeviceNumber || 
              item.Number || 
              item.DeviceId ||
              item.Id ||
              ""
            );
            
            if (deviceNumber && deviceNumber !== "undefined" && deviceNumber !== "null") {
              // Нормализуем ключ (убираем пробелы, приводим к строке)
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
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.warn('[Meters] Item without device number:', item);
              }
            }
          });
        } else {
          console.warn('[Meters] History items is not an array:', historyItems, typeof historyItems);
        }
        
        // Сортируем историю по дате (новые первыми)
        Object.keys(groupedHistory).forEach((key) => {
          groupedHistory[key].sort((a, b) => {
            const dateA = new Date(a.ReadingDate || a.Date || 0).getTime();
            const dateB = new Date(b.ReadingDate || b.Date || 0).getTime();
            return dateB - dateA;
          });
        });
        
        // Проверяем, есть ли показания за текущий месяц для каждого счетчика
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentMonthReadings: Record<string, boolean> = {};
        const lastReadings: Record<string, string> = {};
        
        Object.keys(groupedHistory).forEach((key) => {
          const historyForDevice = groupedHistory[key];
          if (historyForDevice && historyForDevice.length > 0) {
            // Проверяем первое (самое новое) показание
            const latestReading = historyForDevice[0];
            const readingDate = latestReading.ReadingDate || latestReading.Date || latestReading.DateOfHistory;
            
            if (readingDate) {
              const date = new Date(readingDate);
              // Проверяем, что показание за текущий месяц
              if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                currentMonthReadings[key] = true;
              }
              
              // Сохраняем последнее показание для автозаполнения
              const readingValue = latestReading.Reading || latestReading.Value;
              if (readingValue !== undefined && readingValue !== null) {
                lastReadings[key] = String(readingValue);
              }
            }
          }
        });
        
        setHasCurrentMonthReading(currentMonthReadings);
        
        // Автоматически заполняем поля последними показаниями (только если нет показаний за текущий месяц)
        if (Object.keys(lastReadings).length > 0) {
          setReadings(prev => {
            const updated = { ...prev };
            Object.keys(lastReadings).forEach(key => {
              // Заполняем только если:
              // 1. Поле пустое
              // 2. Нет показаний за текущий месяц (чтобы не заполнять, если уже передано)
              if (!updated[key] && !currentMonthReadings[key]) {
                updated[key] = lastReadings[key];
              }
            });
            return updated;
          });
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[Meters] Grouped history:', groupedHistory);
          console.log('[Meters] Grouped history keys:', Object.keys(groupedHistory));
          console.log('[Meters] Meters:', meters.map(m => ({ id: m.id, serialNumber: m.serialNumber })));
          console.log('[Meters] Current month readings:', currentMonthReadings);
          console.log('[Meters] Last readings:', lastReadings);
        }
        
        setMeterHistory(groupedHistory);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn("Could not fetch meter history:", errorData);
      }
    } catch (error: any) {
      console.error("Error fetching meter history:", error);
      // Не показываем ошибку пользователю, так как это не критично
    } finally {
      setLoadingHistory(false);
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

        // Проверка: новое значение не должно быть меньше предыдущего
        if (meter && meter.lastReading !== null && value < meter.lastReading) {
          setError(
            `Показания для счетчика ${meter.serialNumber} не могут быть меньше предыдущих (${meter.lastReading.toLocaleString("ru-RU", { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} м³)`
          );
          setSubmitting(false);
          return;
        }
        
        // Дополнительная проверка: если есть показания за текущий месяц, не разрешаем отправку
        if (hasCurrentMonthReading[meterId]) {
          setError(`Показания для счетчика ${meter.serialNumber} уже переданы в этом месяце`);
          setSubmitting(false);
          return;
        }
      }
      
      // Проверка: показания можно передавать только с 6 по 25 число
      if (!canSubmit) {
        setError("Показания можно передавать только с 6 по 25 число каждого месяца");
        setSubmitting(false);
        return;
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
          fetchMeterHistory(selectedAccountId); // Обновляем историю после отправки
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
                      {hasCurrentMonthReading[meter.id] && (
                        <Alert className="mt-2 mb-2 bg-yellow-50 border-yellow-200">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800 text-sm">
                            Показания за текущий месяц уже переданы. Следующая передача возможна в следующем месяце.
                          </AlertDescription>
                        </Alert>
                      )}
                      <Input
                        id={`meter-${meter.id}`}
                        type="number"
                        step="0.01"
                        min={lastReading !== null ? lastReading : 0}
                        value={readings[meter.id] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Сохраняем значение даже если поле заблокировано
                          handleReadingChange(meter.id, value);
                          
                          // Валидация: новое значение не должно быть меньше предыдущего
                          if (value && lastReading !== null) {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue < lastReading) {
                              setError(`Показания не могут быть меньше предыдущих (${lastReading.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} м³)`);
                            } else {
                              setError(null);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Сохраняем значение при потере фокуса
                          const value = e.target.value;
                          if (value && value.trim() !== "") {
                            handleReadingChange(meter.id, value);
                          }
                        }}
                        placeholder={lastReading !== null ? `Не менее ${lastReading.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Введите показания"}
                        className="mt-1"
                        required
                        disabled={!canSubmit || hasCurrentMonthReading[meter.id]}
                      />
                      {lastReading !== null && (
                        <p className="text-xs text-gray-500 mt-1">
                          Минимальное значение: {lastReading.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} м³
                        </p>
                      )}
                      {!canSubmit && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Показания можно передавать только с 6 по 25 число каждого месяца
                        </p>
                      )}
                      {/* Показываем последнее введенное показание */}
                      {readings[meter.id] && readings[meter.id].trim() !== "" && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-blue-600 mb-1">Введенное показание:</p>
                          <p className="text-sm font-semibold text-blue-800">
                            {!isNaN(parseFloat(readings[meter.id])) 
                              ? parseFloat(readings[meter.id]).toLocaleString("ru-RU", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) + " м³"
                              : readings[meter.id] + " м³"}
                          </p>
                        </div>
                      )}
                      
                      {/* Показываем последнее показание из истории */}
                      {(() => {
                        const historyForMeter = meterHistory[meter.id];
                        if (historyForMeter && historyForMeter.length > 0) {
                          const latestReading = historyForMeter[0];
                          const readingValue = latestReading.Reading || latestReading.Value;
                          const readingDate = latestReading.ReadingDate || latestReading.Date || latestReading.DateOfHistory;
                          
                          if (readingValue !== undefined && readingValue !== null) {
                            return (
                              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                                <p className="text-xs text-gray-600 mb-1">Последнее показание:</p>
                                <p className="text-sm font-semibold text-gray-800">
                                  {parseFloat(String(readingValue)).toLocaleString("ru-RU", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} м³
                                </p>
                                {readingDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(readingDate).toLocaleDateString("ru-RU", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
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
                disabled={
                  submitting || 
                  Object.keys(readings).length === 0 || 
                  !canSubmit ||
                  Object.keys(hasCurrentMonthReading).some(key => hasCurrentMonthReading[key] && readings[key])
                }
                className="w-full"
                size="lg"
              >
                {submitting ? "Отправка..." : "Отправить показания"}
              </Button>
              {Object.keys(hasCurrentMonthReading).some(key => hasCurrentMonthReading[key] && readings[key]) && (
                <p className="text-xs text-yellow-600 text-center mt-2">
                  Невозможно отправить: показания за текущий месяц уже переданы
                </p>
              )}
              <p className="text-xs text-gray-500 text-center mt-4">
                Проверьте правильность введенных показаний перед отправкой
              </p>
            </CardContent>
          </Card>

          {/* Показываем предыдущие показания под кнопкой отправки */}
          {meters.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">История показаний</CardTitle>
                <CardDescription>
                  Предыдущие показания счетчиков
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <p className="text-sm text-gray-500 text-center py-4">Загрузка истории показаний...</p>
                ) : Object.keys(meterHistory).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">История показаний отсутствует</p>
                ) : (
                  <div className="space-y-6">
                    {meters.map((meter) => {
                      const historyForMeter = meterHistory[meter.id];
                      
                      if (!historyForMeter || historyForMeter.length === 0) {
                        return null;
                      }
                      
                      return (
                        <div key={meter.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <h4 className="text-sm font-semibold mb-3">
                            {meter.serialNumber}
                            {meter.serviceName && <span className="text-gray-500 font-normal ml-2">• {meter.serviceName}</span>}
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {historyForMeter.slice(0, 10).map((item, index) => {
                              const readingValue = item.Reading || item.Value;
                              const readingDate = item.ReadingDate || item.Date || item.DateOfHistory;
                              if (readingValue === undefined && !readingDate) return null;
                              
                              return (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {readingValue !== undefined && readingValue !== null
                                            ? `${parseFloat(String(readingValue)).toLocaleString("ru-RU", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })} м³`
                                            : "—"}
                                        </p>
                                        {item.Service && (
                                          <p className="text-xs text-gray-500 mt-0.5">{item.Service}</p>
                                        )}
                                      </div>
                                      {item.Volume !== undefined && item.Volume !== null && (
                                        <div className="text-right ml-4">
                                          <p className="text-xs text-gray-600">Объем:</p>
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
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(readingDate).toLocaleDateString("ru-RU", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })}
                                      </p>
                                    )}
                                    {item.PastReading !== undefined && item.PastReading !== null && (
                                      <p className="text-xs text-gray-400 mt-0.5">
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
                          {historyForMeter.length > 10 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Показано последних 10 из {historyForMeter.length} показаний
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
