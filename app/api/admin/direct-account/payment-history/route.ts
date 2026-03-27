import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { getPaymentHistory } from "@/lib/1c-api";
import { getDirectAccountSession } from "@/lib/direct-account-session";

export const dynamic = 'force-dynamic';

/**
 * GET - получить историю платежей для прямого доступа (только для админов)
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
    const token = searchParams.get("token");
    let accountNumber = searchParams.get("accountNumber");
    let password = searchParams.get("password");
    let region = searchParams.get("region");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (token) {
      const sessionCtx = getDirectAccountSession(token, session.user.id);
      if (!sessionCtx) {
        return NextResponse.json({ error: "Сессия прямого доступа истекла. Подключитесь заново." }, { status: 401 });
      }
      accountNumber = sessionCtx.accountNumber;
      password = sessionCtx.password;
      region = sessionCtx.region;
    }

    if (!accountNumber || !password || !region || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Отсутствуют необходимые параметры" },
        { status: 400 }
      );
    }

    // Формируем даты
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: "Неверный формат даты" },
        { status: 400 }
      );
    }

    // Запрашиваем историю платежей из 1С
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
