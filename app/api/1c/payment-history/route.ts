import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { getPaymentHistory } from "@/lib/1c-api";

export const dynamic = 'force-dynamic';

/**
 * GET - получить историю платежей из 1С
 * Проксирует запрос к 1С API
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

    if (!accountId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Не указаны все обязательные параметры" },
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
      account.accountNumber,
      account.password1c,
      fromDate,
      toDate,
      account.region
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching payment history from 1C:", error);
    return NextResponse.json(
      {
        error: "Ошибка при получении истории платежей из 1С",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}


