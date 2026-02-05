"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Printer, ArrowLeft, Smartphone, Phone, MapPin, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

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
    StartReading?: number | string;
    PastReading?: number | string;
    PreviousReading?: number | string;
    EndReading?: number | string;
    Reading?: number | string;
    CurrentReading?: number | string;
  }>;
  MetersInfo?: Array<{
    service: string;
    deviceNumber: string;
    norm?: string;
    nextVerificationDate?: string;
  }>;
  metersInfo?: Array<{
    service: string;
    deviceNumber: string;
    norm?: string;
    nextVerificationDate?: string;
  }>;
}

export default function DirectAccountReceiptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountNumber = searchParams.get("accountNumber");
  const password = searchParams.get("password");
  const region = searchParams.get("region");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (accountNumber && password && region) {
      fetchReceiptData();
    } else {
      setError("Отсутствуют необходимые параметры подключения");
      setLoading(false);
    }
  }, [accountNumber, password, region, dateFrom, dateTo]);

  const fetchReceiptData = async () => {
    if (!accountNumber || !password || !region) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        accountNumber,
        password,
        region,
      });
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/admin/direct-account/receipt?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        const receiptDataRaw = data.data || data;
        setReceiptData(receiptDataRaw);
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
      const scale = openForPrint ? 2.5 : 2;
      const jpegQuality = openForPrint ? 0.95 : 0.9;

      const canvas = await html2canvas(receiptRef.current, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
        imageTimeout: 0,
        quality: 1.0,
        allowTaint: false,
        foreignObjectRendering: false,
      });

      const pdf = new jsPDF("p", "mm", "a4");
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

      const fileName = `receipt_${accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`;

      if (openForPrint) {
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');

        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      } else {
        pdf.save(fileName);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      window.print();
    }
  };

  const handlePrint = async () => {
    await generatePDF(true);
  };

  const handleDownloadPDF = async () => {
    await generatePDF(false);
  };

  const handleQRClick = () => {
    if (!receiptData || !accountNumber) return;
    const lscode = accountNumber;
    const address = receiptData.Address || receiptData.address || "";
    const commonDutyAmount = parseAmount(receiptData.CommonDuty || receiptData.commonDuty || "0");
    const amountToPay = commonDutyAmount > 0 ? commonDutyAmount : 0;

    if (!lscode || !address) {
      console.error("Недостаточно данных для генерации QR-кода");
      return;
    }

    let periodDate: Date;
    if (dateFrom) {
      periodDate = new Date(dateFrom);
    } else {
      const today = new Date();
      const monthOffset = today.getDate() < 5 ? -2 : -1;
      periodDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    }
    const paymPeriod = `${String(periodDate.getMonth() + 1).padStart(2, "0")}.${periodDate.getFullYear()}`;
    const periodStr = periodDate.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    const purpose = `Оплата услуг водоснабжения и водоотведения за ${periodStr}. Л/с ${lscode}`.trim();

    const sbpURL = generateSBPURL(lscode, address, amountToPay, paymPeriod, purpose);
    window.open(sbpURL, "_blank");
  };

  const parseAmount = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return isNaN(value) ? 0 : value;
    if (typeof value === "string") {
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
        <Button onClick={() => window.close()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Закрыть
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Кнопки управления */}
      <div className="container py-6 px-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="outline" onClick={() => window.close()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Закрыть
          </Button>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const lscode = accountNumber;
              const addr = receiptData?.Address || receiptData?.address;
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

      {/* Квитанция - используем тот же контент из обычной страницы квитанций */}
      <div className="container max-w-4xl mx-auto px-4 pb-8 print:block">
        <Card ref={receiptRef} className="bg-white shadow-md print:shadow-none print:block border-gray-200">
          <CardContent className="p-6 sm:p-8 print:p-6 text-gray-900">
            {/* Здесь будет содержимое квитанции - используем компонент из обычной страницы */}
            <div className="text-center py-8">
              <p className="text-xl font-semibold mb-2">Квитанция #{accountNumber}</p>
              <p className="text-gray-600">Данные успешно загружены из 1С</p>
              <p className="text-sm text-gray-500 mt-4">
                Полное отображение квитанции будет реализовано в следующем обновлении.
                <br />
                Сейчас доступен просмотр базовых данных.
              </p>
              <div className="mt-6 text-left max-w-md mx-auto space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Л/с:</span>
                  <span className="font-medium">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Адрес:</span>
                  <span className="font-medium">{receiptData.Address || receiptData.address || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Абонент:</span>
                  <span className="font-medium">{receiptData.LSName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Задолженность:</span>
                  <span className="font-medium text-lg">
                    {formatCurrency(receiptData.CommonDuty || receiptData.commonDuty || 0)} ₽
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
