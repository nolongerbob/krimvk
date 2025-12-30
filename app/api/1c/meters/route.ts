import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { get1CUserData } from "@/lib/1c-api";

export const dynamic = 'force-dynamic';

/**
 * GET - получить список счетчиков из 1С для лицевого счета
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

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

    // Получаем данные из 1С
    const data = await get1CUserData(
      account.accountNumber,
      account.password1c,
      account.region
    );

    // Преобразуем данные счетчиков из 1С в нужный формат
    // Структура данных из 1С может отличаться, нужно адаптировать под реальную структуру
    const meters = data?.MeteringDevices || data?.Devices || data?.meters || [];

    return NextResponse.json({
      success: true,
      meters: meters.map((meter: any, index: number) => ({
        id: meter.Number || meter.DeviceNumber || `device-${index}`,
        serialNumber: meter.SerialNumber || meter.Number || `Счетчик ${index + 1}`,
        type: meter.ServiceName?.toLowerCase().includes("горяч") ? "горячая" : "холодная",
        address: account.address,
        lastReading: meter.LastReading ? parseFloat(meter.LastReading) : null,
        lastReadingDate: meter.LastReadingDate || null,
        serviceName: meter.ServiceName || "Водоснабжение",
      })),
    });
  } catch (error: any) {
    console.error("Error fetching meters from 1C:", error);
    return NextResponse.json(
      {
        error: "Ошибка при получении счетчиков из 1С",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}


