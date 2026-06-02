import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { get1CUserData } from "@/lib/1c-api";
import { directAccountCredentialsFromToken } from "@/lib/direct-account-route";

export const dynamic = 'force-dynamic';

/**
 * GET - получить счетчики для прямого доступа (только для админов)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const token = new URL(request.url).searchParams.get("token");
    const creds = directAccountCredentialsFromToken(token, auth.admin);
    if (!creds.ok) return creds.response;

    const { accountNumber, password, region } = creds.credentials;

    const data = await get1CUserData(accountNumber, password, region);

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
