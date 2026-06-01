import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { get1CUserData, getMeteringDeviceHistory, formatDateFor1C, getPaymentHistory } from "@/lib/1c-api";
import { parseMeterHistory, type MeterHistoryItem } from "@/lib/parse-meter-history";
import { buildMeterReadingsFromDevices, hasValidMeterReadings } from "@/lib/receipt-meter-mapping";
import { decryptPassword1c } from "@/lib/password1c-crypto";

export const dynamic = 'force-dynamic';

/** Нормализует название услуги. */
function normService(s: string | undefined): string {
  return (s || "").toLowerCase().trim();
}

/**
 * Канонический ключ услуги: в 1С в History может быть "ХВС", в ChargesAndPayments — "Холодная вода".
 */
function canonicalServiceKey(s: string | undefined): string {
  const n = normService(s);
  if (!n) return n;
  if (/холод|хвс|водоснабжен/.test(n)) return "хвс";
  if (/горяч|гвс/.test(n)) return "гвс";
  if (/водоотвед|канализ/.test(n)) return "канализация";
  return n;
}

/**
 * Подставляет в ChargesAndPayments показания (Нач./Кон.) из истории.
 * Поля как в «Истории показаний»: Reading, Value, PastReading, PreviousReading, Service.
 */
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
    // Список по дате (новые первые): [0]=последнее, [1]=предпоследнее=Кон., [2]=третье=Нач.
    // Если записей мало: Кон. = list[1] ?? list[0], Нач. = list[2] ?? PastReading(list[1] ?? list[0])
    const forEnd = list[1] ?? list[0];
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
 * GET - получить данные квитанции из 1С (в т.ч. показания: предыдущее, текущее, расход)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!accountId) {
      return NextResponse.json(
        { error: "Не указан ID лицевого счета" },
        { status: 400 }
      );
    }

    // Проверяем, является ли пользователь админом
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";

    // Админ может получать квитанции для любого лицевого счета, обычный пользователь - только для своих
    const account = await prisma.userAccount.findFirst({
      where: isAdmin
        ? { id: accountId, isActive: true }
        : { id: accountId, userId: session.user.id, isActive: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Лицевой счет не найден" }, { status: 404 });
    }
    const password1c = decryptPassword1c(account.password1c);
    if (!password1c) {
      return NextResponse.json({ error: "Пароль для 1С не установлен. Обратитесь в службу поддержки." }, { status: 400 });
    }
    if (!account.region) {
      return NextResponse.json({ error: "Район не указан для лицевого счета. Обратитесь в службу поддержки." }, { status: 400 });
    }

    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    const data = await get1CUserData(
      account.accountNumber,
      password1c,
      account.region,
      fromDate,
      toDate
    );

    // Нормализация показаний из ChargesAndPayments (1С может отдавать русские поля)
    const chargesRaw = (data.ChargesAndPayments ?? data.chargesAndPayments) as Array<Record<string, unknown>> | undefined;
    if (chargesRaw?.length) {
      chargesRaw.forEach((c) => {
        const endVal = c.EndReading ?? c.Reading ?? c.CurrentReading ?? (c as Record<string, unknown>).КонечноеПоказание ?? (c as Record<string, unknown>).Показание ?? (c as Record<string, unknown>).ТекущееПоказание;
        const startVal = c.StartReading ?? c.PastReading ?? c.PreviousReading ?? (c as Record<string, unknown>).НачальноеПоказание ?? (c as Record<string, unknown>).ПредыдущееПоказание ?? (c as Record<string, unknown>).Предыдущее;
        if (endVal != null && endVal !== "") c.EndReading = endVal;
        if (startVal != null && startVal !== "") c.StartReading = startVal;
      });
    }

    // Период для истории: расширяем на месяц назад и вперёд — показания по счёту
    // могут быть переданы в следующем месяце (как в «Истории показаний»).
    // По умолчанию: предыдущий месяц (платим за прошлый месяц)
    let histFrom: Date;
    let histTo: Date;
    const t = new Date();
    const defaultMonth = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const billStart = fromDate ?? defaultMonth;
    const billEnd = toDate ?? new Date(defaultMonth.getFullYear(), defaultMonth.getMonth() + 1, 0);
    histFrom = new Date(billStart.getFullYear(), billStart.getMonth() - 1, 1);
    histTo = new Date(billEnd.getFullYear(), billEnd.getMonth() + 2, 0); // конец следующего после счёта месяца
    const dateFromStr = formatDateFor1C(histFrom);
    const dateToStr = formatDateFor1C(histTo);

    // Получаем оплаты за период квитанции (не общую сумму CommonPayment)
    let paymentsForPeriod = 0;
    try {
      const paymentHistory = await getPaymentHistory(
        account.accountNumber,
        password1c,
        billStart,
        billEnd,
        account.region
      );
      
      // Обрабатываем структуру ответа 1С (может быть Payments, payments, или массив)
      let paymentsArray: any[] = [];
      if (paymentHistory) {
        if (Array.isArray(paymentHistory)) {
          paymentsArray = paymentHistory;
        } else if (paymentHistory.Payments) {
          paymentsArray = Array.isArray(paymentHistory.Payments) ? paymentHistory.Payments : [paymentHistory.Payments];
        } else if (paymentHistory.payments) {
          paymentsArray = Array.isArray(paymentHistory.payments) ? paymentHistory.payments : [paymentHistory.payments];
        } else if (typeof paymentHistory === "object") {
          // Если это объект с ключами-датами
          Object.values(paymentHistory).forEach((val: any) => {
            if (Array.isArray(val)) {
              paymentsArray.push(...val);
            } else if (val) {
              paymentsArray.push(val);
            }
          });
        }
      }
      
      // Суммируем оплаты за период
      paymentsForPeriod = paymentsArray.reduce((sum, payment: any) => {
        const amount = parseFloat(String(payment.Charge || payment.amount || payment.Amount || 0).replace(/,/g, ".").replace(/\s/g, ""));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("[receipt] getPaymentHistory error:", err);
      // Если не удалось получить историю оплат, используем CommonPayment как fallback
      paymentsForPeriod = parseFloat(String(data.CommonPayment || data.commonPayment || 0).replace(/,/g, ".").replace(/\s/g, ""));
      if (isNaN(paymentsForPeriod)) paymentsForPeriod = 0;
    }

    let debug: { historyError?: string; historyFetched: boolean; flatCount: number; byServiceKeys: string[]; chargeKeys: string[]; historyTopKeys?: string[] } | undefined;
    if (process.env.NODE_ENV === "development") {
      debug = { historyFetched: false, flatCount: 0, byServiceKeys: [], chargeKeys: [] };
    }

    // Собираем информацию о счетчиках и нормативах
    const metersInfo: Array<{ service: string; deviceNumber: string; norm?: string }> = [];
    const uniqueDevices = new Set<string>();
    const meterReadings: Array<{ Service: string; PastDate?: string; PastReading?: number | string; Reading: number | string; Volume?: number }> = [];

    try {
      const history = await getMeteringDeviceHistory(
        account.accountNumber,
        password1c,
        account.region,
        dateFromStr,
        dateToStr
      );
      if (debug) {
        debug.historyFetched = true;
        debug.historyTopKeys = history && typeof history === "object" ? Object.keys(history as object) : [];
      }
      const flat = parseMeterHistory(history);
      if (debug) debug.flatCount = flat.length;
      
      // Собираем уникальные счетчики из истории
      flat.forEach((item) => {
        const deviceNumber = String(item.NumberOfDevice || item.DeviceNumber || item.Number || "");
        const service = String(item.Service || (item as Record<string, unknown>).Услуга || (item as Record<string, unknown>).ServiceName || "");
        if (deviceNumber && service) {
          const key = `${service}|${deviceNumber}`;
          if (!uniqueDevices.has(key)) {
            uniqueDevices.add(key);
            metersInfo.push({ service, deviceNumber });
          }
        }
      });
      
      const enrichResult = enrichChargesWithReadings((data.ChargesAndPayments ?? data.chargesAndPayments) as Record<string, unknown>[] | undefined, flat);
      if (debug) {
        debug.byServiceKeys = enrichResult.byServiceKeys;
        debug.chargeKeys = enrichResult.chargeKeys;
      }
      
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
              // Если счетчика нет в истории, но есть норматив, добавляем запись
              metersInfo.push({ service, deviceNumber: "—", norm });
            }
          }
        });
      }
      
      if (flat.length === 0 && history && typeof history === "object") {
        console.warn("[receipt] history flat is empty. history keys:", Object.keys(history as object));
      }

      // Собираем MeterReadings для блока «Показания ИПУ»: по каждому прибору (услуга+номер) последние два показания
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
      console.error("[receipt] getMeteringDeviceHistory or enrich error:", err);
      if (debug) debug.historyError = err;
    }

    // Показания из get_data (MeteringDevices) — основной источник, как на старом сайте (pdf.php)
    // Формат 1С: PastReading, PastDate, Reading, Date, Service, NumberOfDevice. При пустых Past* подставляем Reading/Date.
    const rawDevices = data.MeteringDevices ?? data.Devices ?? data.meters ?? data.Счетчики ?? data.DevicesList ?? [];
    const meteringDevices = Array.isArray(rawDevices) ? rawDevices : (typeof rawDevices === "object" && rawDevices !== null ? Object.values(rawDevices) : []) as Array<Record<string, unknown>>;
    if (meteringDevices.length > 0) {
      // Используем get_data только если он реально содержит показания, иначе сохраняем историю
      const rowsFromDevices = buildMeterReadingsFromDevices(meteringDevices);
      if (hasValidMeterReadings(rowsFromDevices)) {
        meterReadings.length = 0;
        meterReadings.push(...rowsFromDevices);
      }
      // Подстановка Нач./Кон. в начисления из тех же MeteringDevices
      const charges = (data.ChargesAndPayments ?? data.chargesAndPayments) as Array<Record<string, unknown>> | undefined;
      if (charges?.length) {
        charges.forEach((c) => {
          if (c.StartReading != null && c.EndReading != null) return;
          const key = canonicalServiceKey(String(c.Service ?? ""));
          const dev = meteringDevices.find((d) => canonicalServiceKey(String(d.Service ?? d.Услуга ?? d.ServiceName ?? "")) === key);
          if (!dev) return;
          const endVal = dev.Reading ?? dev.Value ?? dev.Показание ?? dev.LastReading;
          const pastVal = dev.PastReading ?? dev.PreviousReading ?? dev.ПредыдущееПоказание ?? dev.Предыдущее;
          const startVal = (pastVal !== "" && pastVal != null) ? pastVal : endVal;
          if (c.EndReading == null && endVal != null && endVal !== "") c.EndReading = endVal;
          if (c.StartReading == null && startVal != null && startVal !== "") c.StartReading = startVal;
        });
      }
    }

    // Fallback: блок «Показания ИПУ» из ChargesAndPayments, если есть Нач./Кон. по услугам с приборами
    if (meterReadings.length === 0 && chargesRaw?.length) {
      chargesRaw.forEach((c) => {
        const key = canonicalServiceKey(String(c.Service ?? ""));
        if (key !== "хвс" && key !== "гвс" && key !== "канализация") return;
        const endVal = c.EndReading ?? c.Reading;
        const startVal = c.StartReading ?? c.PastReading;
        if (endVal == null && startVal == null) return;
        const service = String(c.Service ?? "");
        if (!service) return;
        const vol = c.Volume != null && c.Volume !== "" ? parseFloat(String(c.Volume).replace(",", ".").replace(/\s/g, "")) : NaN;
        meterReadings.push({
          Service: service,
          PastReading: startVal,
          Reading: endVal ?? startVal,
          Volume: !isNaN(vol) ? vol : undefined,
        });
      });
    }

    const res: { success: boolean; data: object; _debug?: typeof debug } = {
      success: true,
      data: {
        accountNumber: account.accountNumber,
        address: account.address,
        name: account.name,
        ...data,
        // Заменяем CommonPayment на сумму оплат за период квитанции
        CommonPayment: paymentsForPeriod.toFixed(2),
        commonPayment: paymentsForPeriod.toFixed(2),
        // Добавляем информацию о счетчиках и нормативах
        MetersInfo: metersInfo,
        metersInfo: metersInfo,
        // Показания ИПУ для блока «Показания» на квитанции
        MeterReadings: meterReadings,
        meterReadings: meterReadings,
      },
    };
    if (process.env.NODE_ENV === "development" && debug) res._debug = debug;
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Error fetching receipt data from 1C:", error);
    return NextResponse.json(
      {
        error: "Ошибка при получении данных для квитанции из 1С",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}


