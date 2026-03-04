import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { get1CUserData, getMeteringDeviceHistory, formatDateFor1C, getPaymentHistory } from "@/lib/1c-api";
import { parseMeterHistory, type MeterHistoryItem } from "@/lib/parse-meter-history";

export const dynamic = 'force-dynamic';

// Используем ту же логику, что и в обычном receipt API
function normService(s: string | undefined): string {
  return (s || "").toLowerCase().trim();
}

function canonicalServiceKey(s: string | undefined): string {
  const n = normService(s);
  if (!n) return n;
  if (/холод|хвс/.test(n)) return "хвс";
  if (/горяч|гвс/.test(n)) return "гвс";
  if (/водоотвед|канализ/.test(n)) return "канализация";
  return n;
}

function enrichChargesWithReadings(
  charges: Array<Record<string, unknown>> | undefined,
  historyFlat: MeterHistoryItem[]
): { byServiceKeys: string[]; chargeKeys: string[] } {
  const byServiceKeys: string[] = [];
  const chargeKeys: string[] = [];
  if (!charges?.length) return { byServiceKeys, chargeKeys };
  const byService = new Map<string, MeterHistoryItem[]>();
  historyFlat.forEach((h) => {
    const svc = h.Service ?? (h as Record<string, unknown>).Услуга ?? (h as Record<string, unknown>).ServiceName;
    const k = canonicalServiceKey(String(svc ?? ""));
    if (!k) return;
    if (!byService.has(k)) byService.set(k, []);
    byService.get(k)!.push(h);
  });
  byService.forEach((_, k) => { byServiceKeys.push(k); });
  byService.forEach((arr) => {
    arr.sort((a, b) => (b.ReadingDate || b.Date || "").localeCompare(a.ReadingDate || a.Date || ""));
  });

  charges.forEach((c) => {
    chargeKeys.push(canonicalServiceKey(String(c.Service ?? "")));
    if (c.StartReading != null && c.EndReading != null) return;
    const key = canonicalServiceKey(String(c.Service ?? ""));
    const list = byService.get(key);
    if (!list?.length) return;
    const forEnd = list[1];
    const forStart = list[2];
    const endVal = forEnd && ((forEnd.Reading ?? (forEnd as Record<string, unknown>).Value) ?? null);
    let startVal = forStart && ((forStart.Reading ?? (forStart as Record<string, unknown>).Value) ?? null);
    if (startVal == null && forEnd) startVal = (forEnd.PastReading ?? (forEnd as Record<string, unknown>).PreviousReading) ?? null;
    if (c.EndReading == null && endVal != null && endVal !== "") c.EndReading = endVal;
    if (c.StartReading == null && startVal != null && startVal !== "") c.StartReading = startVal;
  });
  return { byServiceKeys, chargeKeys };
}

/**
 * GET - получить квитанцию для прямого доступа (только для админов)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем, что пользователь - админ
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const accountNumber = searchParams.get("accountNumber");
    const password = searchParams.get("password");
    const region = searchParams.get("region");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!accountNumber || !password || !region) {
      return NextResponse.json(
        { error: "Отсутствуют необходимые параметры" },
        { status: 400 }
      );
    }

    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    const data = await get1CUserData(
      accountNumber,
      password,
      region,
      fromDate,
      toDate
    );

    // Период для истории
    let histFrom: Date;
    let histTo: Date;
    const t = new Date();
    const defaultMonth = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const billStart = fromDate ?? defaultMonth;
    const billEnd = toDate ?? new Date(defaultMonth.getFullYear(), defaultMonth.getMonth() + 1, 0);
    histFrom = new Date(billStart.getFullYear(), billStart.getMonth() - 1, 1);
    histTo = new Date(billEnd.getFullYear(), billEnd.getMonth() + 2, 0);
    const dateFromStr = formatDateFor1C(histFrom);
    const dateToStr = formatDateFor1C(histTo);

    // Получаем оплаты за период
    let paymentsForPeriod = 0;
    try {
      const paymentHistory = await getPaymentHistory(
        accountNumber,
        password,
        billStart,
        billEnd,
        region
      );

      let paymentsArray: any[] = [];
      if (paymentHistory) {
        if (Array.isArray(paymentHistory)) {
          paymentsArray = paymentHistory;
        } else if (paymentHistory.Payments) {
          paymentsArray = Array.isArray(paymentHistory.Payments) ? paymentHistory.Payments : [paymentHistory.Payments];
        } else if (paymentHistory.payments) {
          paymentsArray = Array.isArray(paymentHistory.payments) ? paymentHistory.payments : [paymentHistory.payments];
        } else if (typeof paymentHistory === "object") {
          Object.values(paymentHistory).forEach((val: any) => {
            if (Array.isArray(val)) {
              paymentsArray.push(...val);
            } else if (val) {
              paymentsArray.push(val);
            }
          });
        }
      }

      paymentsForPeriod = paymentsArray.reduce((sum, payment: any) => {
        const amount = parseFloat(String(payment.Charge || payment.amount || payment.Amount || 0).replace(/,/g, ".").replace(/\s/g, ""));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("[direct-receipt] getPaymentHistory error:", err);
      paymentsForPeriod = parseFloat(String(data.CommonPayment || data.commonPayment || 0).replace(/,/g, ".").replace(/\s/g, ""));
      if (isNaN(paymentsForPeriod)) paymentsForPeriod = 0;
    }

    // Получаем счетчики из 1С для дат поверки
    const metersFrom1C = data?.MeteringDevices || data?.Devices || data?.meters || [];

    // Собираем информацию о счетчиках и нормативах
    const metersInfo: Array<{ service: string; deviceNumber: string; norm?: string; nextVerificationDate?: string }> = [];
    const uniqueDevices = new Set<string>();
    const meterReadings: Array<{ Service: string; PastDate?: string; PastReading?: number | string; Reading: number | string; Volume?: number }> = [];

    try {
      const history = await getMeteringDeviceHistory(
        accountNumber,
        password,
        region,
        dateFromStr,
        dateToStr
      );
      const flat = parseMeterHistory(history);

      // Собираем уникальные счетчики из истории
      flat.forEach((item) => {
        const deviceNumber = String(item.NumberOfDevice || item.DeviceNumber || item.Number || "");
        const service = String(item.Service || (item as Record<string, unknown>).Услуга || (item as Record<string, unknown>).ServiceName || "");
        if (deviceNumber && service) {
          const key = `${service}|${deviceNumber}`;
          if (!uniqueDevices.has(key)) {
            uniqueDevices.add(key);
            // Ищем дату поверки в данных счетчиков из 1С
            const meterFrom1C = metersFrom1C.find((m: any) => {
              const mNumber = String(m.NumberOfDevice || m.Number || m.DeviceNumber || m.SerialNumber || "");
              return mNumber === deviceNumber;
            });
            const nextVerificationDate = meterFrom1C
              ? (meterFrom1C.DateOfNextVerification ||
                 meterFrom1C.NextVerificationDate ||
                 meterFrom1C.VerificationDate ||
                 meterFrom1C.DateVerification ||
                 meterFrom1C.ДатаПоверки ||
                 meterFrom1C.СледующаяПоверка ||
                 meterFrom1C.ДатаСледующейПоверки ||
                 null)
              : null;
            metersInfo.push({ service, deviceNumber, nextVerificationDate: nextVerificationDate || undefined });
          }
        }
      });

      enrichChargesWithReadings((data.ChargesAndPayments ?? data.chargesAndPayments) as Record<string, unknown>[] | undefined, flat);

      // Добавляем нормативы из ChargesAndPayments
      if (data.ChargesAndPayments || data.chargesAndPayments) {
        const charges = (data.ChargesAndPayments ?? data.chargesAndPayments) as Array<Record<string, unknown>>;
        charges.forEach((charge) => {
          const service = String(charge.Service || "");
          const norm = charge.Norm ? String(charge.Norm) : undefined;
          if (service && norm) {
            const meter = metersInfo.find(m => canonicalServiceKey(m.service) === canonicalServiceKey(service));
            if (meter) {
              meter.norm = norm;
            } else {
              // Пытаемся найти дату поверки для этой услуги
              const meterFrom1C = metersFrom1C.find((m: any) => {
                const mService = String(m.ServiceName || m.Service || "");
                return canonicalServiceKey(mService) === canonicalServiceKey(service);
              });
              const nextVerificationDate = meterFrom1C
                ? (meterFrom1C.DateOfNextVerification ||
                   meterFrom1C.NextVerificationDate ||
                   meterFrom1C.VerificationDate ||
                   meterFrom1C.DateVerification ||
                   meterFrom1C.ДатаПоверки ||
                   meterFrom1C.СледующаяПоверка ||
                   meterFrom1C.ДатаСледующейПоверки ||
                   null)
                : null;
              metersInfo.push({ service, deviceNumber: "—", norm, nextVerificationDate: nextVerificationDate || undefined });
            }
          }
        });
      }

      // Показания ИПУ для блока «Показания» на квитанции
      const byDevice = new Map<string, MeterHistoryItem[]>();
      flat.forEach((item) => {
        const deviceNumber = String(item.NumberOfDevice || item.DeviceNumber || item.Number || "");
        const service = String(item.Service || (item as Record<string, unknown>).Услуга || (item as Record<string, unknown>).ServiceName || "");
        if (!service) return;
        const key = `${service}|${deviceNumber || "—"}`;
        if (!byDevice.has(key)) byDevice.set(key, []);
        byDevice.get(key)!.push(item);
      });
      byDevice.forEach((arr, key) => {
        arr.sort((a, b) => (b.ReadingDate || b.Date || "").localeCompare(a.ReadingDate || a.Date || ""));
        const cur = arr[0];
        const prev = arr[1];
        const service = cur?.Service ?? (cur as Record<string, unknown>)?.Услуга ?? (cur as Record<string, unknown>)?.ServiceName ?? key.split("|")[0];
        const reading = cur?.Reading ?? (cur as Record<string, unknown>)?.Value ?? "";
        const pastReading = prev ? (prev.Reading ?? (prev as Record<string, unknown>)?.Value) : (cur?.PastReading ?? (cur as Record<string, unknown>)?.PreviousReading);
        const pastDate = prev?.ReadingDate ?? prev?.Date;
        const pastDateStr = pastDate ? (typeof pastDate === "string" && pastDate.length >= 10 ? pastDate.slice(0, 10) : String(pastDate)) : undefined;
        const rNum = typeof reading === "number" ? reading : parseFloat(String(reading).replace(",", "."));
        const pNum = pastReading != null && pastReading !== "" ? (typeof pastReading === "number" ? pastReading : parseFloat(String(pastReading).replace(",", "."))) : NaN;
        const volume = !isNaN(rNum) && !isNaN(pNum) ? rNum - pNum : undefined;
        meterReadings.push({
          Service: String(service),
          PastDate: pastDateStr,
          PastReading: pastReading,
          Reading: reading,
          Volume: volume,
        });
      });
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("[direct-receipt] getMeteringDeviceHistory error:", err);
    }

    const res = {
      success: true,
      data: {
        accountNumber: accountNumber,
        ...data,
        CommonPayment: paymentsForPeriod.toFixed(2),
        commonPayment: paymentsForPeriod.toFixed(2),
        MetersInfo: metersInfo,
        metersInfo: metersInfo,
        MeterReadings: meterReadings,
        meterReadings: meterReadings,
      },
    };

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Error fetching direct receipt:", error);

    if (error.message?.includes("AUTH_ERROR")) {
      return NextResponse.json(
        { error: "Неверный номер лицевого счета или пароль" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Ошибка при получении данных квитанции",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
