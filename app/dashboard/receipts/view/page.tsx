"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Printer, ArrowLeft, Smartphone, Phone, MapPin, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

// Динамический импорт QR-кода для избежания проблем с SSR
const QRCodeSVG = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-[130px] h-[130px] bg-gray-200 animate-pulse rounded"></div>
});
import { generateSBPQRString, generateSBPURL } from "@/lib/qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ReceiptData {
  LSCode?: string;
  lscode?: string;
  LSName?: string;
  Address?: string;
  address?: string;
  CommonDuty?: string;
  commonDuty?: string;
  CommonPayment?: string;
  commonPayment?: string;
  StartCommonDuty?: string;
  startCommonDuty?: string;
  StartDutys?: Array<{
    Service: string;
    Duty: string;
  }>;
  ChargesAndPayments?: Array<{
    Service: string;
    Charge: string;
    ChargeFull: string;
    Volume: string;
    TariffPrice: string;
    Exemption: string;
    Recalculation: string;
    Norm: string;
    Unit: string;
    /** Предыдущее показание (Нач.) — из 1С или истории */
    StartReading?: number | string;
    PastReading?: number | string;
    PreviousReading?: number | string;
    /** Текущее показание (Кон.) — по которому сформирована квитанция */
    EndReading?: number | string;
    Reading?: number | string;
    CurrentReading?: number | string;
  }>;
  MetersInfo?: Array<{
    service: string;
    deviceNumber: string;
    norm?: string;
  }>;
  metersInfo?: Array<{
    service: string;
    deviceNumber: string;
    norm?: string;
  }>;
}

export default function ReceiptViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get("accountId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  useEffect(() => {
    if (accountId) {
      fetchReceiptData();
    }
  }, [accountId, dateFrom, dateTo]);

  const fetchReceiptData = async () => {
    if (!accountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ accountId });
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/1c/receipt?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        // Данные из 1С находятся в data.data или напрямую в data
        const receiptDataRaw = data.data || data;
        setReceiptData(receiptDataRaw);
        setAccountInfo({
          accountNumber: receiptDataRaw.accountNumber || receiptDataRaw.LSCode,
          address: receiptDataRaw.address || receiptDataRaw.Address,
          name: receiptDataRaw.name || receiptDataRaw.LSName,
        });
        if (data._debug) console.log("[receipt] _debug:", data._debug);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке квитанции");
      }
    } catch (error: any) {
      console.error("Error fetching receipt:", error);
      setError("Ошибка при загрузке данных квитанции");
    } finally {
      setLoading(false);
    }
  };

  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePDF = async (openForPrint = false) => {
    if (!receiptRef.current) return;

    try {
      // Для печати используем более высокое качество, для скачивания - оптимизированное
      const scale = openForPrint ? 2.5 : 2; // Выше разрешение для печати
      const jpegQuality = openForPrint ? 0.95 : 0.9; // Выше качество JPEG для печати
      
      // Создаем canvas из HTML элемента с оптимизированными настройками
      const canvas = await html2canvas(receiptRef.current, {
        scale: scale, // Высокое разрешение для четкости
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
        imageTimeout: 0,
        // Высокое качество для четкости
        quality: 1.0, // Максимальное качество
        // Дополнительные настройки для четкости
        allowTaint: false,
        foreignObjectRendering: false,
      });

      // Создаем PDF
      const pdf = new jsPDF("p", "mm", "a4");
      
      // Используем JPEG с высоким качеством для четкости
      const imgData = canvas.toDataURL("image/jpeg", jpegQuality);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      const xOffset = (pdfWidth - imgScaledWidth) / 2;
      const yOffset = (pdfHeight - imgScaledHeight) / 2;

      pdf.addImage(imgData, "JPEG", xOffset, yOffset, imgScaledWidth, imgScaledHeight);
      
      // Генерируем имя файла
      const fileName = `receipt_${receiptData?.LSCode || accountInfo?.accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`;
      
      if (openForPrint) {
        // Открываем PDF в новом окне для печати
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');
        
        if (printWindow) {
          printWindow.onload = () => {
            // Небольшая задержка для загрузки PDF
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      } else {
        // Скачиваем PDF
        pdf.save(fileName);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback на печать браузера
      window.print();
    }
  };

  const handlePrint = async () => {
    // Генерируем PDF и открываем для печати
    await generatePDF(true);
  };

  const handleDownloadPDF = async () => {
    // Генерируем PDF и скачиваем
    await generatePDF(false);
  };

  const handleQRClick = () => {
    if (!receiptData) return;
    const lscode = receiptData.LSCode || receiptData.lscode || accountInfo?.accountNumber || "";
    const address = receiptData.Address || receiptData.address || accountInfo?.address || "";
    const commonDuty = receiptData.CommonDuty || receiptData.commonDuty || "0";
    
    if (!lscode || !address) {
      console.error("Недостаточно данных для генерации QR-кода:", { lscode, address, receiptData });
      return;
    }
    
    const sbpURL = generateSBPURL(lscode, address, commonDuty);
    console.log("SBP URL:", sbpURL);
    console.log("QR String:", generateSBPQRString(lscode, address, commonDuty));
    window.open(sbpURL, "_blank");
  };

  const parseAmount = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return isNaN(value) ? 0 : value;
    if (typeof value === "string") {
      // Заменяем запятую на точку и убираем пробелы
      const normalized = value.replace(/,/g, ".").replace(/\s/g, "");
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    const num = parseAmount(value);
    return num.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Загрузка квитанции...</p>
        </div>
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div className="container py-8 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Квитанция не найдена"}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Кнопки управления (скрываются при печати) */}
      <div className="container py-6 px-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const lscode = receiptData?.LSCode || receiptData?.lscode || accountInfo?.accountNumber;
              const addr = receiptData?.Address || receiptData?.address || accountInfo?.address;
              if (lscode && addr) {
                return (
                  <Button onClick={handleQRClick} className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Оплатить по QR
                  </Button>
                );
              }
              return null;
            })()}
            <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Скачать PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Печать
            </Button>
          </div>
        </div>
      </div>

      {/* Квитанция — дружелюбный формат */}
      <div className="container max-w-4xl mx-auto px-4 pb-8 print:block">
        <Card ref={receiptRef} className="bg-white shadow-md print:shadow-none print:block border-gray-200">
          <CardContent className="p-6 sm:p-8 print:p-6 text-gray-900">
            {(() => {
              const commonDutyAmount = parseAmount(receiptData.CommonDuty);
              const lscode = receiptData.LSCode || receiptData.lscode || accountInfo?.accountNumber || "";
              const address = receiptData.Address || receiptData.address || accountInfo?.address || "";
              const commonDuty = receiptData.CommonDuty || receiptData.commonDuty || "0";
              // Период: если dateFrom указан, используем его; иначе - предыдущий месяц (платим за прошлый месяц)
              let periodDate: Date;
              if (dateFrom) {
                periodDate = new Date(dateFrom);
              } else {
                const today = new Date();
                periodDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              }
              const periodMonth = periodDate.toLocaleDateString("ru-RU", { month: "long" });
              const periodYear = periodDate.getFullYear();
              const periodStr = `${periodMonth} ${periodYear} г.`;
              const receiptNum = receiptData.LSCode || accountInfo?.accountNumber || "";
              // Отрицательный баланс = недоплата (долг), положительный = переплата
              const isOverpaid = commonDutyAmount > 0;
              const isUnderpaid = commonDutyAmount < 0;

              return (
                <>
            {/* Шапка: заголовок слева, сумма и QR справа */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 pb-4 border-b border-gray-200">
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-bold leading-snug text-gray-900">
                  Счёт-квитанция за услугу водоснабжения и водоотведения №{" "}
                  <span className="break-all font-mono">{receiptNum}</span> за {periodStr}
                </h1>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-3 flex-shrink-0 print:break-inside-avoid">
                <div className={`rounded-lg px-4 py-2.5 min-w-0 ${isOverpaid ? "bg-emerald-50 text-emerald-800" : isUnderpaid ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-700"}`}>
                  <p className="text-xs font-medium text-inherit/80">{isOverpaid ? "Переплата" : isUnderpaid ? "К оплате (недоплата)" : "Нет задолженности"}</p>
                  <p className="text-xl font-bold tabular-nums whitespace-nowrap">{formatCurrency(commonDutyAmount)} ₽</p>
                </div>
                {lscode && address && (
                  <div className="flex flex-col items-start sm:items-end">
                    <div onClick={handleQRClick} className="cursor-pointer p-2 bg-white border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-sm transition-all print:border-gray-300" title="Оплата через СБП">
                      <QRCodeSVG value={generateSBPQRString(lscode, address, commonDuty)} size={100} level="M" includeMargin={false} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 print:hidden">Нажмите или отсканируйте для оплаты</p>
                  </div>
                )}
              </div>
            </div>

            {/* Получатель платежа */}
            <div className="mb-5 pb-4 border-b border-gray-200 min-w-0">
              <p className="text-sm font-semibold text-gray-700 mb-2">Получатель платежа</p>
              <div className="text-sm text-gray-600 space-y-0.5 break-words">
                <p className="font-medium text-gray-900">ООО «Крымская Водная Компания»</p>
                <p>296560, с. Лесновка Сакского района, ул. Механизаторов, 9</p>
                <p>ИНН 9107000240, КПП 910701001 · П/с <span className="break-all font-mono">40702810725190003625</span></p>
                <p>Банк: Филиал «Центральный» Банка ВТБ (ПАО), БИК 044525411, корр. счёт <span className="break-all font-mono">30101810145250000411</span></p>
                <p>Тел.: +7 (978) 080-03-66, +7 (978) 741-57-59</p>
              </div>
            </div>

            {/* Плательщик и адрес — компактно */}
            <div className="grid sm:grid-cols-2 gap-4 mb-5 pb-4 border-b border-gray-200">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700 mb-0.5">Плательщик</p>
                <p className="text-sm text-gray-900 break-words">{receiptData.LSName || accountInfo?.name || "—"}</p>
                <p className="text-xs text-gray-500 mt-0.5">Лицевой счёт № <span className="break-all font-mono">{receiptNum}</span></p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700 mb-0.5">Адрес потребления</p>
                <p className="text-sm text-gray-900 break-words">{address || "—"}</p>
              </div>
            </div>

            {/* Справочная информация — компактно */}
            <div className="mb-5 pb-4 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-1.5">Справочная информация</p>
              <ul className="text-sm text-gray-600 space-y-0.5 list-none">
                <li>Льгот и договоров рассрочки не имеется.</li>
                {(() => {
                  const metersInfo = receiptData.MetersInfo || receiptData.metersInfo || [];
                  const metersCount = metersInfo.length;
                  
                  if (metersCount > 0) {
                    return (
                      <>
                        <li>
                          Установлено приборов учёта: <span className="font-medium text-gray-800">{metersCount}</span>.
                        </li>
                        {metersInfo.map((meter, idx) => {
                          const serviceName = meter.service || "Услуга";
                          const deviceNumber = meter.deviceNumber || "—";
                          const norm = meter.norm ? `, норматив: ${meter.norm}` : "";
                          return (
                            <li key={idx}>
                              {serviceName}: прибор учёта № <span className="font-medium text-gray-800">{deviceNumber}</span>{norm}.
                            </li>
                          );
                        })}
                      </>
                    );
                  } else {
                    return <li>Услуги по приборам учёта и нормативам.</li>;
                  }
                })()}
                {receiptData.CommonPayment && parseFloat(receiptData.CommonPayment) > 0 && (
                  <li>Последняя оплата: <span className="font-medium text-gray-800">{formatCurrency(receiptData.CommonPayment)} ₽</span>.</li>
                )}
              </ul>
            </div>

            {/* Расшифровка начислений */}
            {((receiptData.ChargesAndPayments && receiptData.ChargesAndPayments.length > 0) || (receiptData.StartCommonDuty && parseAmount(receiptData.StartCommonDuty) > 0.01)) && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Расшифровка начислений за {periodStr}
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200 -mx-1 print:mx-0">
                  <table className="w-full border-collapse text-xs min-w-[520px] print:text-[10px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border-b border-gray-200 px-1.5 py-1.5 text-left font-semibold text-gray-700 min-w-0 break-words">Услуга</th>
                        <th className="border-b border-gray-200 px-1 py-1.5 text-center font-semibold text-gray-700" colSpan={3}>Показания</th>
                        <th className="border-b border-gray-200 px-1 py-1.5 text-center font-semibold text-gray-700 w-[1%] whitespace-nowrap">Расход</th>
                        <th className="border-b border-gray-200 px-1 py-1.5 text-center font-semibold text-gray-700 w-[1%] whitespace-nowrap">Тариф</th>
                        <th className="border-b border-gray-200 px-1 py-1.5 text-center font-semibold text-gray-700 w-[1%] whitespace-nowrap">Начисл.</th>
                        <th className="border-b border-gray-200 px-1 py-1.5 text-center font-semibold text-gray-700 w-[1%] whitespace-nowrap">Льгота</th>
                        <th className="border-b border-gray-200 px-1 py-1.5 text-center font-semibold text-gray-700 w-[1%] whitespace-nowrap">Перерасч.</th>
                        <th className="border-b border-gray-200 px-1 py-1.5 text-right font-semibold text-gray-700 w-[1%] whitespace-nowrap">Итого, ₽</th>
                      </tr>
                      <tr className="bg-gray-50/80">
                        <th className="border-b border-gray-200 px-1.5 py-1 text-left font-medium text-gray-600" />
                        <th className="border-b border-gray-200 px-0.5 py-1 text-center font-medium text-gray-600">Нач.</th>
                        <th className="border-b border-gray-200 px-0.5 py-1 text-center font-medium text-gray-600">Кон.</th>
                        <th className="border-b border-gray-200 px-0.5 py-1 text-center font-medium text-gray-600">кол-во</th>
                        <th className="border-b border-gray-200 px-1 py-1" />
                        <th className="border-b border-gray-200 px-1 py-1" />
                        <th className="border-b border-gray-200 px-1 py-1" />
                        <th className="border-b border-gray-200 px-1 py-1" />
                        <th className="border-b border-gray-200 px-1 py-1" />
                        <th className="border-b border-gray-200 px-1 py-1" />
                      </tr>
                    </thead>
                    <tbody>
                      {/* Долг на начало периода */}
                      {(() => {
                        const startDutyAmount = parseAmount(receiptData.StartCommonDuty);
                        if (startDutyAmount > 0.01) {
                          if (receiptData.StartDutys && receiptData.StartDutys.length > 0) {
                            return receiptData.StartDutys.map((duty, i) => {
                              const a = parseAmount(duty.Duty);
                              if (a > 0) return (
                                <tr key={`sd-${i}`} className="bg-amber-50/50">
                                  <td className="border-b border-gray-100 px-1.5 py-1 text-gray-900 break-words align-top">{duty.Service || "Долг за предыдущий период"}</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">0,00</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">0,00</td>
                                  <td className="border-b border-gray-100 px-1 py-1 text-right font-medium tabular-nums">{formatCurrency(a)}</td>
                                </tr>
                              );
                              return null;
                            }).filter(Boolean);
                          }
                          return (
                            <tr className="bg-amber-50/50">
                              <td className="border-b border-gray-100 px-1.5 py-1 text-gray-900 break-words align-top">Долг на начало периода</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">—</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">0,00</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-500 tabular-nums">0,00</td>
                              <td className="border-b border-gray-100 px-1 py-1 text-right font-medium tabular-nums">{formatCurrency(startDutyAmount)}</td>
                            </tr>
                          );
                        }
                        return null;
                      })()}
                      {(receiptData.ChargesAndPayments || []).map((c, i) => {
                        const startVal = c.StartReading ?? c.PastReading ?? c.PreviousReading;
                        const endVal = c.EndReading ?? c.Reading ?? c.CurrentReading;
                        const numStart = startVal != null && startVal !== "" ? Number(startVal) : NaN;
                        const numEnd = endVal != null && endVal !== "" ? Number(endVal) : NaN;
                        const qty = !isNaN(numStart) && !isNaN(numEnd) ? (numEnd - numStart) : (c.Volume != null && c.Volume !== "" ? String(c.Volume) : "—");
                        const fmt = (v: number | string) => (typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 2 })) : v);
                        return (
                        <tr key={i} className="hover:bg-gray-50/80">
                          <td className="border-b border-gray-100 px-1.5 py-1 text-gray-900 break-words align-top">{c.Service}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-600 tabular-nums">{startVal != null && startVal !== "" ? fmt(startVal) : "—"}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-600 tabular-nums">{endVal != null && endVal !== "" ? fmt(endVal) : "—"}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-600 tabular-nums">{fmt(qty)}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-600 tabular-nums">{c.Volume || "—"} {c.Unit || "м³"}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-600 tabular-nums">{formatCurrency(c.TariffPrice)}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-600 tabular-nums">{formatCurrency(c.ChargeFull || c.Charge)}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-600 tabular-nums">{parseAmount(c.Exemption) !== 0 ? formatCurrency(c.Exemption) : "0,00"}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-center text-gray-600 tabular-nums">{parseAmount(c.Recalculation) !== 0 ? formatCurrency(c.Recalculation) : "0,00"}</td>
                          <td className="border-b border-gray-100 px-1 py-1 text-right font-medium text-gray-900 tabular-nums">{formatCurrency(c.ChargeFull || c.Charge)}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Расшифровка суммы счёта */}
            {(() => {
              const startDebt = parseAmount(receiptData.StartCommonDuty);
              let totalCharged = 0;
              if (receiptData.ChargesAndPayments?.length) {
                receiptData.ChargesAndPayments.forEach((c) => { totalCharged += parseAmount(c.ChargeFull || c.Charge); });
              }
              const totalRecalc = 0;
              const payments = parseAmount(receiptData.CommonPayment);
              // Для "Задолженность на 1-е число" используем начало периода: если dateFrom указан, используем его; иначе - предыдущий месяц
              let d: Date;
              if (dateFrom) {
                d = new Date(dateFrom);
              } else {
                const today = new Date();
                d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              }
              const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
              const debtLabel = `Задолженность на ${String(firstDay.getDate()).padStart(2, "0")}.${String(firstDay.getMonth() + 1).padStart(2, "0")}.${firstDay.getFullYear()}`;
              const isOverpaid = commonDutyAmount > 0;
              const isUnderpaid = commonDutyAmount < 0;
              const totalRowStyle = isOverpaid ? "bg-emerald-50 text-emerald-800" : isUnderpaid ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-800";
              return (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Расшифровка суммы счёта</p>
                  <div className="max-w-full rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[280px] text-sm border-collapse">
                      <tbody className="text-gray-700">
                        <tr className="border-b border-gray-100"><td className="py-2 pr-4 pl-3">Задолженность на 1-е число</td><td className="py-2 pr-3 pl-2 text-right tabular-nums whitespace-nowrap">{formatCurrency(startDebt)}</td></tr>
                        <tr className="border-b border-gray-100"><td className="py-2 pr-4 pl-3">Перерасчёты</td><td className="py-2 pr-3 pl-2 text-right tabular-nums whitespace-nowrap">{formatCurrency(totalRecalc)}</td></tr>
                        <tr className="border-b border-gray-100"><td className="py-2 pr-4 pl-3">Начислено за {periodStr}</td><td className="py-2 pr-3 pl-2 text-right tabular-nums whitespace-nowrap">{formatCurrency(totalCharged)}</td></tr>
                        <tr className="border-b border-gray-100"><td className="py-2 pr-4 pl-3">Оплаты за {periodStr}</td><td className="py-2 pr-3 pl-2 text-right tabular-nums whitespace-nowrap">{formatCurrency(payments)}</td></tr>
                        <tr className={`font-semibold ${totalRowStyle}`}>
                          <td className="py-3 pl-3">Итого</td>
                          <td className="py-3 pr-3 pl-2 text-right text-base tabular-nums whitespace-nowrap">{formatCurrency(commonDutyAmount)} ₽</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Подвал: контакты и информация */}
            <div className="mt-6 pt-5 border-t border-gray-200">
              <div className="grid sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-gray-600 mb-3">При несвоевременной оплате взыскание задолженности производится в судебном порядке.</p>
                  <p className="text-gray-500">Сформировано {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}. QR-код — оплата через СБП.</p>
                </div>
                <div className="space-y-2 min-w-0">
                  <p className="font-medium text-gray-700 flex flex-wrap items-center gap-x-1 gap-y-0.5 print:gap-0">
                    <Phone className="h-4 w-4 flex-shrink-0 print:hidden" />
                    <span className="mr-1">Тел.:</span>
                    <a href="tel:+79780800366" className="text-sky-600 hover:underline print:text-inherit whitespace-nowrap">+7 (978) 080-03-66</a>
                    <span>,</span>
                    <a href="tel:+79787415759" className="text-sky-600 hover:underline print:text-inherit whitespace-nowrap">+7 (978) 741-57-59</a>
                    <span>,</span>
                    <a href="tel:+79787013050" className="text-sky-600 hover:underline print:text-inherit whitespace-nowrap">+7 (978) 701-30-50</a>
                    <span> (аварийная)</span>
                  </p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 print:hidden" />
                    с. Лесновка Сакского района, ул. Механизаторов, 9
                  </p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0 print:hidden" />
                    Пн–Чт 08:00–17:00, Пт 08:00–16:00 · обед 12:00–12:48
                  </p>
                </div>
              </div>
            </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Стили для печати */}
      <style jsx global>{`
        @media print {
          /* Переопределяем глобальные стили печати для страницы квитанции */
          body * {
            visibility: visible !important;
          }
          
          /* Скрываем только элементы с классом print:hidden */
          .print\\:hidden,
          .print\\:hidden * {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Показываем квитанцию */
          .print\\:block,
          .print\\:block * {
            display: block !important;
            visibility: visible !important;
          }
          
          /* Скрываем навигацию, хедер, футер */
          header,
          footer,
          nav,
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Стили для квитанции */
          body {
            background: white !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          
          /* Предотвращаем разрыв QR-кода на две страницы */
          .print\\:break-inside-avoid,
          .print\\:page-break-inside-avoid,
          .print\\:keep-together {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-region-break-inside: avoid !important;
          }
          
          /* Более строгие правила для блока с QR-кодом */
          div[class*="bg-gray-50"][class*="border-dashed"] {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-region-break-inside: avoid !important;
            orphans: 3 !important;
            widows: 3 !important;
          }
          
          /* Предотвращаем разрыв внутри flex контейнера с QR-кодом */
          div[class*="flex"][class*="items-center"] {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Предотвращаем разрыв таблиц и других блоков */
          table,
          tr,
          td,
          th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Уменьшаем размер QR-кода и всего блока при печати */
          .print\\:scale-75 {
            transform: scale(0.75) !important;
            transform-origin: center !important;
          }
          
          /* Уменьшаем отступы блока с QR-кодом при печати */
          div[class*="bg-gray-50"][class*="border-dashed"] {
            padding: 0.75rem !important;
            margin-top: 1rem !important;
          }
          
          /* Уменьшаем размер QR-кода при печати */
          svg[class*="QRCode"],
          svg[data-testid="qr-code-svg"] {
            max-width: 100px !important;
            max-height: 100px !important;
            width: 100px !important;
            height: 100px !important;
          }
          
          /* Уменьшаем размер текста в блоке QR-кода при печати */
          div[class*="bg-gray-50"][class*="border-dashed"] p,
          div[class*="bg-gray-50"][class*="border-dashed"] h3 {
            font-size: 0.875rem !important;
          }
          
          /* Скрываем кнопку при печати */
          div[class*="bg-gray-50"][class*="border-dashed"] button {
            display: none !important;
          }
          
          /* Убираем отступы страницы для квитанции */
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
}

