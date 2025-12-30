import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - получить все счетчики пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const meters = await prisma.waterMeter.findMany({
      where: { userId: session.user.id },
      include: {
        readings: {
          orderBy: { readingDate: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Форматируем данные для ответа
    const formattedMeters = meters.map((meter) => ({
      id: meter.id,
      serialNumber: meter.serialNumber,
      type: meter.type,
      address: meter.address,
      lastReading: meter.lastReading,
      readings: meter.readings.map((reading) => ({
        value: reading.value,
        readingDate: reading.readingDate,
      })),
    }));

    return NextResponse.json({ meters: formattedMeters });
  } catch (error: any) {
    console.error("Error fetching meters:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: "Ошибка при загрузке счетчиков",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}



