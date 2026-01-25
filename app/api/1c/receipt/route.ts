import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { get1CUserData, getMeteringDeviceHistory, formatDateFor1C } from "@/lib/1c-api";
import { parseMeterHistory, type MeterHistoryItem } from "@/lib/parse-meter-history";

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
  if (/холод|хвс/.test(n)) return "хвс";
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
    // Список по дате (новые первые): [0]=последнее (для след. месяца), [1]=предпоследнее=Кон., [2]=третье=Нач.
    // Кон. = показание, по которому сформирована квитанция. Нач. = предыдущее для этого периода.
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

    const account = await prisma.userAccount.findFirst({
      where: { id: accountId, userId: session.user.id, isActive: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Лицевой счет не найден" }, { status: 404 });
    }
    if (!account.password1c) {
      return NextResponse.json({ error: "Пароль для 1С не установлен. Обратитесь в службу поддержки." }, { status: 400 });
    }
    if (!account.region) {
      return NextResponse.json({ error: "Район не указан для лицевого счета. Обратитесь в службу поддержки." }, { status: 400 });
    }

    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    const data = await get1CUserData(
      account.accountNumber,
      account.password1c,
      account.region,
      fromDate,
      toDate
    );

    // Период для истории: расширяем на месяц назад и вперёд — показания по счёту
    // могут быть переданы в следующем месяце (как в «Истории показаний»).
    let histFrom: Date;
    let histTo: Date;
    const t = new Date();
    const billStart = fromDate ?? new Date(t.getFullYear(), t.getMonth(), 1);
    const billEnd = toDate ?? new Date(t.getFullYear(), t.getMonth() + 1, 0);
    histFrom = new Date(billStart.getFullYear(), billStart.getMonth() - 1, 1);
    histTo = new Date(billEnd.getFullYear(), billEnd.getMonth() + 2, 0); // конец следующего после счёта месяца
    const dateFromStr = formatDateFor1C(histFrom);
    const dateToStr = formatDateFor1C(histTo);

    let debug: { historyError?: string; historyFetched: boolean; flatCount: number; byServiceKeys: string[]; chargeKeys: string[]; historyTopKeys?: string[] } | undefined;
    if (process.env.NODE_ENV === "development") {
      debug = { historyFetched: false, flatCount: 0, byServiceKeys: [], chargeKeys: [] };
    }

    try {
      const history = await getMeteringDeviceHistory(
        account.accountNumber,
        account.password1c,
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
      const enrichResult = enrichChargesWithReadings((data.ChargesAndPayments ?? data.chargesAndPayments) as Record<string, unknown>[] | undefined, flat);
      if (debug) {
        debug.byServiceKeys = enrichResult.byServiceKeys;
        debug.chargeKeys = enrichResult.chargeKeys;
      }
      if (flat.length === 0 && history && typeof history === "object") {
        console.warn("[receipt] history flat is empty. history keys:", Object.keys(history as object));
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("[receipt] getMeteringDeviceHistory or enrich error:", err);
      if (debug) debug.historyError = err;
    }

    const res: { success: boolean; data: object; _debug?: typeof debug } = {
      success: true,
      data: {
        accountNumber: account.accountNumber,
        address: account.address,
        name: account.name,
        ...data,
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


