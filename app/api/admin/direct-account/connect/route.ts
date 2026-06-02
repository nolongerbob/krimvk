import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { get1CUserData } from "@/lib/1c-api";
import { createDirectAccountSession } from "@/lib/direct-account-session";

export const dynamic = 'force-dynamic';

/**
 * GET - подключиться к лицевому счету напрямую (только для админов)
 */
async function handleConnect(
  sessionUserId: string,
  accountNumber: string | null,
  password: string | null,
  region: string | null
) {
  if (!accountNumber) {
    return NextResponse.json(
      { error: "Не указан номер лицевого счета" },
      { status: 400 }
    );
  }

  if (!password) {
    return NextResponse.json(
      { error: "Не указан пароль" },
      { status: 400 }
    );
  }

  if (!region) {
    return NextResponse.json(
      { error: "Не указан регион" },
      { status: 400 }
    );
  }

  const data = await get1CUserData(
    accountNumber,
    password,
    region
  );

  const token = createDirectAccountSession(sessionUserId, accountNumber, password, region);

  return NextResponse.json({
    success: true,
    token,
    data,
  });
}

export async function GET() {
  return NextResponse.json(
    { error: "Используйте POST с JSON: accountNumber, password, region" },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const accountNumber = body?.accountNumber ? String(body.accountNumber) : null;
    const password = body?.password ? String(body.password) : null;
    const region = body?.region ? String(body.region) : null;

    return await handleConnect(auth.admin.userId, accountNumber, password, region);
  } catch (error: any) {
    console.error("Error connecting to direct account:", error);

    // Обрабатываем специфичные ошибки 1С
    if (error.message?.includes("AUTH_ERROR")) {
      return NextResponse.json(
        { error: "Неверный номер лицевого счета или пароль" },
        { status: 401 }
      );
    }

    if (error.message?.includes("TIMEOUT")) {
      return NextResponse.json(
        { error: "Сервер 1С не отвечает. Проверьте доступность сервера или используйте VPN." },
        { status: 504 }
      );
    }

    if (error.message?.includes("CONNECTION_REFUSED") || error.message?.includes("NETWORK_ERROR")) {
      return NextResponse.json(
        { error: "Не удалось подключиться к серверу 1С. Возможно, требуется VPN или сервер недоступен." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Ошибка при подключении к лицевому счету",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
