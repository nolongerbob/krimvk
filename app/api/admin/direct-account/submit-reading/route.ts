import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { submitMeterReading } from "@/lib/1c-api";
import { directAccountCredentialsFromToken } from "@/lib/direct-account-route";

export const dynamic = 'force-dynamic';

/**
 * POST - передать показания для прямого доступа (только для админов)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const token = new URL(request.url).searchParams.get("token");
    const creds = directAccountCredentialsFromToken(token, auth.admin);
    if (!creds.ok) return creds.response;

    const { accountNumber, password, region } = creds.credentials;

    const body = await request.json();
    const { submissions } = body;

    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
      return NextResponse.json(
        { error: "Не указаны показания для передачи" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const submission of submissions) {
      const { meterId, reading } = submission;

      if (!meterId || reading === undefined || reading === null) {
        errors.push({
          meterId,
          error: "Некорректные данные показания",
        });
        continue;
      }

      try {
        const result = await submitMeterReading(
          accountNumber,
          password,
          meterId,
          reading,
          region
        );

        results.push({
          meterId,
          success: true,
          result,
        });
      } catch (error: any) {
        console.error(`Error submitting reading for meter ${meterId}:`, error);
        errors.push({
          meterId,
          error: error.message || "Ошибка при передаче показания",
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return NextResponse.json(
        {
          error: "Не удалось передать ни одно показание",
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in direct submit-reading:", error);

    if (error.message?.includes("AUTH_ERROR")) {
      return NextResponse.json(
        { error: "Неверный номер лицевого счета или пароль" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Ошибка при передаче показаний",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
