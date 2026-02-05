import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { getMeteringDeviceHistory } from "@/lib/1c-api";

export const dynamic = 'force-dynamic';

/**
 * GET - получить историю показаний счетчиков для прямого доступа (только для админов)
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

    // Если даты не указаны, используем последние 12 месяцев
    let finalDateFrom = dateFrom;
    let finalDateTo = dateTo;

    if (!finalDateFrom || !finalDateTo) {
      const today = new Date();
      const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);

      // Формат даты: ДД.ММ.ГГГГ
      finalDateFrom = `${String(twelveMonthsAgo.getDate()).padStart(2, '0')}.${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}.${twelveMonthsAgo.getFullYear()}`;
      finalDateTo = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    }

    // Запрашиваем историю показаний из 1С
    const history = await getMeteringDeviceHistory(
      accountNumber,
      password,
      region,
      finalDateFrom,
      finalDateTo
    );

    // Логируем структуру ответа для отладки
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
