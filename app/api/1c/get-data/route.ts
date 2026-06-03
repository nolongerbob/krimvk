import { NextRequest, NextResponse } from "next/server";
import { withApiRoute } from "@/lib/api-route";
import { getAppSession } from "@/lib/get-app-session";
import { prisma } from "@/lib/prisma";
import { get1CUserData } from "@/lib/1c-api";
import { jsonFrom1cError } from "@/lib/1c-error-response";
import { decryptPassword1c } from "@/lib/password1c-crypto";

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  try {
    const session = await getAppSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!accountId) {
      return NextResponse.json(
        { error: "Не указан ID лицевого счета" },
        { status: 400 }
      );
    }

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

    const password1c = decryptPassword1c(account.password1c);
    if (!password1c) {
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

    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    const data = await get1CUserData(
      account.accountNumber,
      password1c,
      account.region,
      fromDate,
      toDate
    );

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return jsonFrom1cError(error);
  }
}

export const GET = withApiRoute(getHandler, "GET /api/1c/get-data");
