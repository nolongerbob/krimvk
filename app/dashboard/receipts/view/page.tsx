"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Printer, ArrowLeft, FileText, QrCode } from "lucide-react";
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Создаем canvas из HTML элемента
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Создаем PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      const xOffset = (pdfWidth - imgScaledWidth) / 2;
      const yOffset = (pdfHeight - imgScaledHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, imgScaledWidth, imgScaledHeight);
      
      // Генерируем имя файла
      const fileName = `receipt_${receiptData?.LSCode || accountInfo?.accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`;
      
      // Скачиваем PDF
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback на печать браузера
      window.print();
    }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const period = dateFrom && dateTo 
    ? `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
    : `Текущий период (${new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" })})`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Кнопки управления (скрываются при печати) */}
      <div className="container py-6 px-4 print:hidden">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Скачать PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Печать
            </Button>
          </div>
        </div>
      </div>

      {/* Квитанция */}
      <div className="container max-w-4xl mx-auto px-4 pb-8">
        <Card ref={receiptRef} className="bg-white shadow-lg print:shadow-none">
          <CardContent className="p-8 print:p-6">
            {/* Шапка */}
            <div className="flex items-center justify-center gap-4 mb-8 pb-6 border-b-2 border-blue-600">
              <img 
                src="/images/logo.png" 
                alt="Логотип Крымская Водная Компания" 
                className="h-16 w-16 object-contain"
              />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Крымская Водная Компания
                </h1>
                <p className="text-lg text-gray-600">Квитанция на оплату коммунальных услуг</p>
              </div>
            </div>

            {/* Информация о периоде */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Период</p>
              <p className="text-lg font-semibold text-gray-900">{period}</p>
            </div>

            {/* Данные абонента */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Лицевой счет</p>
                <p className="text-lg font-semibold text-gray-900">
                  {receiptData.LSCode || accountInfo?.accountNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Абонент</p>
                <p className="text-lg font-semibold text-gray-900">
                  {receiptData.LSName || accountInfo?.name || "—"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Адрес</p>
                <p className="text-lg font-semibold text-gray-900">
                  {receiptData.Address || accountInfo?.address}
                </p>
              </div>
            </div>

            {/* Долг на начало периода */}
            {receiptData.StartCommonDuty && parseFloat(receiptData.StartCommonDuty) > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-gray-600 mb-2">Долг на начало периода</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(receiptData.StartCommonDuty)} ₽
                </p>
                {receiptData.StartDutys && receiptData.StartDutys.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {receiptData.StartDutys.map((duty, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        {duty.Service}: {formatCurrency(duty.Duty)} ₽
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Начисления по услугам */}
            {receiptData.ChargesAndPayments && receiptData.ChargesAndPayments.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Начисления по услугам</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Услуга
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Объем
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Тариф
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Льгота
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                          Перерасчет
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          К оплате
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Долг на начало периода - добавляем в таблицу если есть */}
                      {(() => {
                        const startDutyAmount = parseAmount(receiptData.StartCommonDuty);
                        if (startDutyAmount > 0.01) {
                          // Если есть разбивка по услугам, показываем их отдельно
                          if (receiptData.StartDutys && receiptData.StartDutys.length > 0) {
                            return receiptData.StartDutys.map((duty, index) => {
                              const dutyAmount = parseAmount(duty.Duty);
                              if (dutyAmount > 0) {
                                return (
                                  <tr key={`start-duty-${index}`} className="hover:bg-gray-50 bg-yellow-50">
                                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 font-semibold">
                                      {duty.Service || "Долг за предыдущий период"}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                      —
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                      —
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                      —
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                      —
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-yellow-700">
                                      {formatCurrency(dutyAmount)} ₽
                                    </td>
                                  </tr>
                                );
                              }
                              return null;
                            }).filter(Boolean);
                          } else {
                            // Если нет разбивки, показываем общий долг
                            return (
                              <tr key="start-duty" className="hover:bg-gray-50 bg-yellow-50">
                                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 font-semibold">
                                  Долг на начало периода
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                  —
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                  —
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                  —
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                  —
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-yellow-700">
                                  {formatCurrency(startDutyAmount)} ₽
                                </td>
                              </tr>
                            );
                          }
                        }
                        return null;
                      })()}
                      {/* Начисления за текущий период */}
                      {receiptData.ChargesAndPayments.map((charge, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                            {charge.Service}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                            {charge.Volume} {charge.Unit || "м³"}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                            {formatCurrency(charge.TariffPrice)} ₽
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                            {parseAmount(charge.Exemption) !== 0 ? `${formatCurrency(charge.Exemption)} ₽` : "—"}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                            {parseAmount(charge.Recalculation) !== 0 ? `${formatCurrency(charge.Recalculation)} ₽` : "—"}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(charge.ChargeFull || charge.Charge)} ₽
                          </td>
                        </tr>
                      ))}
                      {/* Прочая задолженность - если есть разница между суммой таблицы и CommonDuty */}
                      {(() => {
                        // Вычисляем сумму всех строк в таблице
                        let tableSum = 0;
                        
                        // Долг на начало периода
                        const startDutyAmount = parseAmount(receiptData.StartCommonDuty);
                        if (startDutyAmount > 0.01) {
                          if (receiptData.StartDutys && receiptData.StartDutys.length > 0) {
                            receiptData.StartDutys.forEach((duty) => {
                              tableSum += parseAmount(duty.Duty);
                            });
                          } else {
                            tableSum += startDutyAmount;
                          }
                        }
                        
                        // Начисления за текущий период
                        if (receiptData.ChargesAndPayments && Array.isArray(receiptData.ChargesAndPayments)) {
                          receiptData.ChargesAndPayments.forEach((charge) => {
                            tableSum += parseAmount(charge.ChargeFull || charge.Charge);
                          });
                        }
                        
                        // Итоговая задолженность из CommonDuty
                        const commonDutyAmount = parseAmount(receiptData.CommonDuty);
                        const totalDebt = Math.abs(commonDutyAmount);
                        
                        // Разница между общей задолженностью и суммой в таблице
                        const difference = totalDebt - tableSum;
                        
                        // Если разница больше 1 копейки, показываем "Прочую задолженность"
                        if (difference > 0.01) {
                          return (
                            <tr key="other-debt" className="hover:bg-gray-50 bg-orange-50">
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 font-semibold">
                                Прочая задолженность
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                —
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                —
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                —
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-700">
                                —
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-orange-700">
                                {formatCurrency(difference)} ₽
                              </td>
                            </tr>
                          );
                        }
                        return null;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Оплачено в текущем периоде */}
            {receiptData.CommonPayment && parseFloat(receiptData.CommonPayment) > 0 && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-sm text-gray-600 mb-1">Оплачено в текущем периоде</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(receiptData.CommonPayment)} ₽
                </p>
              </div>
            )}

            {/* Итого к оплате */}
            {(() => {
              // Вычисляем итоговую сумму к оплате из CommonDuty
              // CommonDuty - это итоговая задолженность (может быть отрицательной)
              const commonDutyAmount = parseAmount(receiptData.CommonDuty);
              const totalToPay = Math.abs(commonDutyAmount);
              
              // Также вычисляем сумму из таблицы для проверки
              let tableSum = 0;
              
              // Долг на начало периода
              const startDutyAmount = parseAmount(receiptData.StartCommonDuty);
              if (startDutyAmount > 0.01) {
                if (receiptData.StartDutys && receiptData.StartDutys.length > 0) {
                  // Если есть разбивка, суммируем её
                  receiptData.StartDutys.forEach((duty) => {
                    tableSum += parseAmount(duty.Duty);
                  });
                } else {
                  // Если нет разбивки, добавляем общий долг
                  tableSum += startDutyAmount;
                }
              }
              
              // Начисления за текущий период
              if (receiptData.ChargesAndPayments && Array.isArray(receiptData.ChargesAndPayments)) {
                receiptData.ChargesAndPayments.forEach((charge) => {
                  tableSum += parseAmount(charge.ChargeFull || charge.Charge);
                });
              }
              
              // Используем CommonDuty как основной источник истины
              // (он уже учитывает все: долг на начало + начисления - оплаты)
              const displayAmount = totalToPay;
              
              return (
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-100 mb-1">Итого к оплате</p>
                      <p className="text-4xl font-bold">
                        {formatCurrency(displayAmount)} ₽
                      </p>
                    </div>
                    <FileText className="h-16 w-16 text-blue-200 opacity-50" />
                  </div>
                </div>
              );
            })()}

            {/* QR-код для оплаты через СБП */}
            {(() => {
              const commonDuty = receiptData.CommonDuty || receiptData.commonDuty || receiptData.CommonDuty || "0";
              const lscode = receiptData.LSCode || receiptData.lscode || accountInfo?.accountNumber || "";
              const address = receiptData.Address || receiptData.address || accountInfo?.address || "";
              
              // Отладка
              console.log("QR Code Debug:", { 
                lscode, 
                address, 
                commonDuty, 
                receiptData, 
                accountInfo 
              });
              
              // Показываем QR-код если есть лицевой счет и адрес
              if (lscode && address) {
                try {
                  const qrString = generateSBPQRString(lscode, address, commonDuty);
                  console.log("QR String generated:", qrString);
                  
                  return (
                    <div className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className="flex flex-col items-center">
                          <div 
                            onClick={handleQRClick}
                            className="cursor-pointer hover:opacity-80 transition-opacity p-4 bg-white rounded-lg shadow-md"
                            title="Нажмите для оплаты через СБП"
                          >
                            <QRCodeSVG
                              value={qrString}
                              size={130}
                              level="M"
                              includeMargin={true}
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-2 text-center max-w-[150px]">
                            Нажмите на QR-код для оплаты через СБП
                          </p>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                            <QrCode className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Оплата через СБП</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Отсканируйте QR-код в приложении банка или нажмите на него для перехода к оплате
                          </p>
                          <Button
                            onClick={handleQRClick}
                            className="w-full md:w-auto"
                            size="sm"
                          >
                            Оплатить через СБП
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error("Error generating QR code:", error);
                  return (
                    <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-600">Ошибка генерации QR-кода: {String(error)}</p>
                    </div>
                  );
                }
              }
              
              // Показываем сообщение если данных недостаточно
              return (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-600">
                    Недостаточно данных для генерации QR-кода. LSCode: {lscode || "нет"}, Address: {address || "нет"}
                  </p>
                </div>
              );
            })()}

            {/* Подвал */}
            <div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
              <p>Квитанция сформирована автоматически</p>
              <p className="mt-1">
                Дата формирования: {new Date().toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Стили для печати */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:p-6 {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

