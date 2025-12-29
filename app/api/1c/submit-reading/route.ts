import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { submitMeterReading } from "@/lib/1c-api";

/**
 * POST - передать показания счетчика в 1С
 * Проксирует запрос к 1С API
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { accountId, deviceNumber, reading } = await request.json();

    if (!accountId || !deviceNumber || reading === undefined) {
      return NextResponse.json(
        { error: "Не указаны все обязательные параметры" },
        { status: 400 }
      );
    }

    const readingValue = parseFloat(reading);
    if (isNaN(readingValue) || readingValue < 0) {
      return NextResponse.json(
        { error: "Неверное значение показаний" },
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

    // Проверяем ограничения: показания можно передавать только с 6 по 25 число
    const today = new Date();
    const dayOfMonth = today.getDate();
    if (dayOfMonth < 6 || dayOfMonth > 25) {
      return NextResponse.json(
        { error: "Показания можно передавать только с 6 по 25 число каждого месяца" },
        { status: 400 }
      );
    }

    // Отправляем показания в 1С
    const result = await submitMeterReading(
      account.accountNumber,
      account.password1c,
      deviceNumber,
      readingValue,
      account.region
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Error submitting reading to 1C:", error);
    return NextResponse.json(
      {
        error: "Ошибка при передаче показаний в 1С",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}


