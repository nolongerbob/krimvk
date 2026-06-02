import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getPaymentHistory } from "@/lib/1c-api";
import { directAccountCredentialsFromToken } from "@/lib/direct-account-route";

export const dynamic = 'force-dynamic';

/**
 * GET - получить историю платежей для прямого доступа (только для админов)
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

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Укажите dateFrom и dateTo" },
        { status: 400 }
      );
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: "Неверный формат даты" },
        { status: 400 }
      );
    }

    const data = await getPaymentHistory(
      accountNumber,
      password,
      fromDate,
      toDate,
      region
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching payment history from 1C:", error);

    if (error.message?.includes("AUTH_ERROR")) {
      return NextResponse.json(
        { error: "Неверный номер лицевого счета или пароль" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Ошибка при получении истории платежей из 1С",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
