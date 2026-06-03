import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/get-app-session";
import { prisma } from "@/lib/prisma";

// GET - получить счетчики по лицевому счету
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAppSession(request);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Обрабатываем params как Promise или обычный объект (для совместимости)
    const resolvedParams = params instanceof Promise ? await params : params;

    const account = await prisma.userAccount.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id,
      },
      include: {
        meters: {
          include: {
            readings: {
              orderBy: { readingDate: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Лицевой счет не найден" },
        { status: 404 }
      );
    }

    const formattedMeters = account.meters.map((meter) => ({
      id: meter.id,
      serialNumber: meter.serialNumber,
      type: meter.type,
      address: meter.address,
      lastReading: meter.lastReading,
      readings: (meter.readings || []).map((reading) => ({
        value: reading.value,
        readingDate: reading.readingDate.toISOString(),
      })),
    }));

    return NextResponse.json({ meters: formattedMeters });
  } catch (error: any) {
    console.error("Error fetching meters:", error);
    return NextResponse.json(
      { 
        error: "Ошибка при загрузке счетчиков",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

