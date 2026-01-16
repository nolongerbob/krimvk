import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { getMeteringDeviceHistory } from "@/lib/1c-api";

/**
 * GET - получить историю показаний счетчиков из 1С
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
        { error: "Не указан лицевой счет" },
        { status: 400 }
      );
    }

    // Получаем лицевой счет пользователя
    const account = await prisma.userAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Лицевой счет не найден" },
        { status: 404 }
      );
    }

    if (!account.password1c) {
      return NextResponse.json(
        { error: "Пароль для 1С не установлен. Обратитесь в службу поддержки." },
        { status: 400 }
      );
    }

    if (!account.region) {
      return NextResponse.json(
        { error: "Район не указан для лицевого счета. Обратитесь в службу поддержки." },
        { status: 400 }
      );
    }

    // Запрашиваем историю показаний из 1С
    // Если даты не указаны, используем текущий месяц
    let finalDateFrom = dateFrom;
    let finalDateTo = dateTo;
    
    if (!finalDateFrom || !finalDateTo) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Формат даты как на старом сайте: ДД.ММ.ГГГГ
      finalDateFrom = `${String(firstDay.getDate()).padStart(2, '0')}.${String(firstDay.getMonth() + 1).padStart(2, '0')}.${firstDay.getFullYear()}`;
      finalDateTo = `${String(lastDay.getDate()).padStart(2, '0')}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${lastDay.getFullYear()}`;
    }

    const history = await getMeteringDeviceHistory(
      account.accountNumber,
      account.password1c,
      account.region,
      finalDateFrom,
      finalDateTo
    );

    // Логируем структуру ответа для отладки
    if (process.env.NODE_ENV === 'development') {
      console.log('[meter-history API] Raw history response:', {
        type: typeof history,
        isArray: Array.isArray(history),
        keys: history && typeof history === 'object' ? Object.keys(history) : [],
        hasHistory: history && typeof history === 'object' ? 'History' in history : false,
      });
    }

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error("Error fetching meter history from 1C:", error);
    return NextResponse.json(
      {
        error: "Ошибка при получении истории показаний из 1С",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
