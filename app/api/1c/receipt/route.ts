import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { get1CUserData } from "@/lib/1c-api";

/**
 * GET - получить PDF квитанцию из 1С
 * Пока возвращает данные для генерации PDF (в будущем можно добавить генерацию PDF на сервере)
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
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    // Получаем данные из 1С для генерации квитанции
    const data = await get1CUserData(
      account.accountNumber,
      account.password1c,
      account.region,
      fromDate,
      toDate
    );

    // Возвращаем данные для генерации PDF
    // В будущем здесь можно добавить генерацию PDF на сервере
    return NextResponse.json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        address: account.address,
        name: account.name,
        ...data,
      },
      message: "Для генерации PDF квитанции используйте данные из ответа",
    });
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


