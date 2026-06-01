import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { submitMeterReading } from "@/lib/1c-api";
import { getDirectAccountSession } from "@/lib/direct-account-session";

export const dynamic = 'force-dynamic';

/**
 * POST - передать показания для прямого доступа (только для админов)
 */
export async function POST(request: NextRequest) {
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
