import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getMeteringDeviceHistory } from "@/lib/1c-api";
import { directAccountCredentialsFromToken } from "@/lib/direct-account-route";

export const dynamic = 'force-dynamic';

/**
 * GET - получить историю показаний счетчиков для прямого доступа (только для админов)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const creds = directAccountCredentialsFromToken(token, auth.admin);
    if (!creds.ok) return creds.response;

    const { accountNumber, password, region } = creds.credentials;

    let finalDateFrom = dateFrom;
    let finalDateTo = dateTo;

    if (!finalDateFrom || !finalDateTo) {
      const today = new Date();
      const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);

      finalDateFrom = `${String(twelveMonthsAgo.getDate()).padStart(2, '0')}.${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}.${twelveMonthsAgo.getFullYear()}`;
      finalDateTo = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    }

    const history = await getMeteringDeviceHistory(
      accountNumber,
      password,
      region,
      finalDateFrom,
      finalDateTo
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('[admin meter-history API] Raw history response:', {
        type: typeof history,
        isArray: Array.isArray(history),
        keys: history && typeof history === 'object' ? Object.keys(history) : [],
        hasHistory: history && typeof history === 'object' ? 'History' in history : false,
      });
    }

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error("Error fetching meter history from 1C:", error);

    if (error.message?.includes("AUTH_ERROR")) {
      return NextResponse.json(
        { error: "Неверный номер лицевого счета или пароль" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Ошибка при получении истории показаний из 1С",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
