import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { submitMeterReading, getMeteringDeviceHistory } from "@/lib/1c-api";

// Force dynamic rendering - this route uses headers() via getServerSession
export const dynamic = 'force-dynamic';

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

    // Проверяем, что показания еще не передавались в этом месяце
    try {
      // Формируем даты для текущего месяца (формат ДД.ММ.ГГГГ как на старом сайте)
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const dateFrom = `${String(firstDay.getDate()).padStart(2, '0')}.${String(firstDay.getMonth() + 1).padStart(2, '0')}.${firstDay.getFullYear()}`;
      const dateTo = `${String(lastDay.getDate()).padStart(2, '0')}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${lastDay.getFullYear()}`;
      
      const history = await getMeteringDeviceHistory(
        account.accountNumber,
        account.password1c,
        account.region,
        dateFrom,
        dateTo
      );

      // На старом сайте ответ содержит поле History (строки 378-395 PHP кода)
      const historyItems = history?.History || history?.history || [];
      
      for (const item of historyItems) {
        // Ищем показания для этого счетчика (используется NumberOfDevice)
        const itemDeviceNumber = String(item.NumberOfDevice || item.DeviceNumber || item.Number || "");
        if (itemDeviceNumber === String(deviceNumber)) {
          // Проверяем дату показания
          const readingDate = item.ReadingDate || item.Date || item.readingDate;
          if (readingDate) {
            const date = new Date(readingDate);
            if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
              return NextResponse.json(
                { 
                  error: `Показания для этого счетчика уже переданы в этом месяце. Последняя передача: ${date.toLocaleDateString("ru-RU")}` 
                },
                { status: 400 }
              );
            }
          }
        }
      }
    } catch (historyError: any) {
      // Если не удалось получить историю, продолжаем (не блокируем отправку)
      console.warn("Could not check meter history:", historyError?.message);
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


