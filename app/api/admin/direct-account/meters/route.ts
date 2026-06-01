import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { get1CUserData } from "@/lib/1c-api";
import { getDirectAccountSession } from "@/lib/direct-account-session";

export const dynamic = 'force-dynamic';

/**
 * GET - получить счетчики для прямого доступа (только для админов)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    let accountNumber = searchParams.get("accountNumber");
    let password = searchParams.get("password");
    let region = searchParams.get("region");

    if (token) {
      const sessionCtx = getDirectAccountSession(token, session.user.id);
      if (!sessionCtx) {
        return NextResponse.json({ error: "Сессия прямого доступа истекла. Подключитесь заново." }, { status: 401 });
      }
      accountNumber = sessionCtx.accountNumber;
      password = sessionCtx.password;
      region = sessionCtx.region;
    }

    if (!accountNumber || !password || !region) {
      return NextResponse.json(
        { error: "Отсутствуют необходимые параметры" },
        { status: 400 }
      );
    }

    // Получаем данные из 1С
    const data = await get1CUserData(
      accountNumber,
      password,
      region
    );

    // Преобразуем данные счетчиков из 1С в нужный формат
    const meters = data?.MeteringDevices || data?.Devices || data?.meters || [];

    return NextResponse.json({
      success: true,
      meters: meters.map((meter: any, index: number) => {
        const numberOfDevice =
          meter.NumberOfDevice ||
          meter.Number ||
          meter.DeviceNumber ||
          meter.SerialNumber ||
          `device-${index}`;

        // Ищем дату поверки в различных возможных полях
        const nextVerificationDate =
          meter.DateOfNextVerification ||
          meter.NextVerificationDate ||
          meter.VerificationDate ||
          meter.DateVerification ||
          meter.ДатаПоверки ||
          meter.СледующаяПоверка ||
          meter.ДатаСледующейПоверки ||
          null;

        return {
          id: String(numberOfDevice),
          serialNumber:
            meter.SerialNumber ||
            meter.NumberOfDevice ||
            meter.Number ||
            meter.DeviceNumber ||
            `Счетчик ${index + 1}`,
          type: meter.ServiceName?.toLowerCase().includes("горяч") ? "горячая" : "холодная",
          address: data?.Address || data?.address || "",
          lastReading: meter.LastReading ? parseFloat(meter.LastReading) : null,
          lastReadingDate: meter.LastReadingDate || null,
          serviceName: meter.ServiceName || "Водоснабжение",
          nextVerificationDate: nextVerificationDate,
        };
      }),
    });
  } catch (error: any) {
    console.error("Error fetching direct meters:", error);

    if (error.message?.includes("AUTH_ERROR")) {
      return NextResponse.json(
        { error: "Неверный номер лицевого счета или пароль" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Ошибка при получении счетчиков",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
