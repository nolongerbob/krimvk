import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// POST - отправить показания счетчиков
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { readings, photos, aiData } = await request.json();

    if (!readings || typeof readings !== "object") {
      return NextResponse.json(
        { error: "Неверный формат данных" },
        { status: 400 }
      );
    }

    // Временно отключено ограничение по датам для тестирования
    // Проверяем ограничения: показания можно передавать только с 6 по 25 число
    // const today = new Date();
    // const dayOfMonth = today.getDate();
    // if (dayOfMonth < 6 || dayOfMonth > 25) {
    //   return NextResponse.json(
    //     { error: "Показания можно передавать только с 6 по 25 число каждого месяца" },
    //     { status: 400 }
    //   );
    // }

    // Проверяем, что все счетчики принадлежат пользователю
    const meterIds = Object.keys(readings);
    const today = new Date();
    const userMeters = await prisma.waterMeter.findMany({
      where: {
        id: { in: meterIds },
        userId: session.user.id,
      },
      include: {
        readings: {
          where: {
            readingDate: {
              gte: new Date(today.getFullYear(), today.getMonth(), 1), // С начала текущего месяца
            },
          },
          orderBy: {
            readingDate: "desc",
          },
          take: 1,
        },
      },
    });

    if (userMeters.length !== meterIds.length) {
      return NextResponse.json(
        { error: "Один или несколько счетчиков не найдены" },
        { status: 404 }
      );
    }

    // Создаем показания для каждого счетчика
    const createdReadings = [];
    for (const meterId of meterIds) {
      const value = parseFloat(readings[meterId]);
      
      if (isNaN(value) || value < 0) {
        return NextResponse.json(
          { error: `Неверное значение показаний для счетчика ${meterId}` },
          { status: 400 }
        );
      }

      const meter = userMeters.find((m) => m.id === meterId);
      if (!meter) continue;

      // Проверяем, что показания уже не передавались в этом месяце
      if (meter.readings.length > 0) {
        return NextResponse.json(
          { error: `Показания для счетчика ${meter.serialNumber} уже переданы в этом месяце` },
          { status: 400 }
        );
      }

      // Проверяем, что новые показания не меньше предыдущих
      if (meter.lastReading !== null && value < meter.lastReading) {
        return NextResponse.json(
          { error: `Показания для счетчика ${meter.serialNumber} не могут быть меньше предыдущих (${meter.lastReading} м³)` },
          { status: 400 }
        );
      }

      // Получаем данные ИИ и фото для этого счетчика
      const photoUrl = photos?.[meterId] || null;
      const aiInfo = aiData?.[meterId] || null;

      // Создаем запись показаний
      const reading = await prisma.meterReading.create({
        data: {
          meterId,
          value,
          readingDate: new Date(),
          photoUrl,
          aiRecognizedValue: aiInfo?.recognizedValue || null,
          aiConfidence: aiInfo?.confidence || null,
        },
      });

      // Обновляем последние показания счетчика
      await prisma.waterMeter.update({
        where: { id: meterId },
        data: { lastReading: value },
      });

      createdReadings.push(reading);
    }

    return NextResponse.json({
      success: true,
      message: "Показания успешно отправлены",
      readings: createdReadings,
    });
  } catch (error) {
    console.error("Error submitting meter readings:", error);
    return NextResponse.json(
      { error: "Ошибка при отправке показаний" },
      { status: 500 }
    );
  }
}



