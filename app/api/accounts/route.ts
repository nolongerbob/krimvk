import { parseMeterNumber } from "@/lib/parse-meter-number";
import { NextRequest, NextResponse } from "next/server";
import { withApiRoute } from "@/lib/api-route";
import { getAppSession } from "@/lib/get-app-session";
import { formatUserAccountsForApi } from "@/lib/format-user-accounts";
import { prisma } from "@/lib/prisma";
import { encryptPassword1c } from "@/lib/password1c-crypto";
import { is1CAccountPayload, normalize1CResponse } from '@/lib/normalize-1c-response';
import { UtilityAccessError } from '@/lib/utility-access-policy';

export const dynamic = 'force-dynamic';

async function getAccounts(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const accounts = await prisma.userAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      meters: {
        include: {
          readings: { orderBy: { readingDate: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accounts: formatUserAccountsForApi(accounts) });
}

export const GET = withApiRoute(getAccounts, "GET /api/accounts");

// POST - добавить новый лицевой счет
export async function POST(request: NextRequest) {
  try {
    const session = await getAppSession(request);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { accountNumber, password1c, region } = await request.json();

    if (!accountNumber) {
      return NextResponse.json(
        { error: "Номер лицевого счета обязателен" },
        { status: 400 }
      );
    }

    if (!password1c) {
      return NextResponse.json(
        { error: "Пароль для 1С обязателен" },
        { status: 400 }
      );
    }

    if (!region) {
      return NextResponse.json(
        { error: "Район обязателен" },
        { status: 400 }
      );
    }

    const { assertValid1cRegion, Invalid1cRegionError } = await import("@/lib/1c-regions");
    let regionSafe: string;
    try {
      regionSafe = assertValid1cRegion(region);
    } catch (e) {
      const msg = e instanceof Invalid1cRegionError ? e.message : "Недопустимый район";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Проверяем, не существует ли уже такой лицевой счет у пользователя
    const existingAccount = await prisma.userAccount.findFirst({
      where: {
        accountNumber,
        userId: session.user.id,
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "Лицевой счет с таким номером уже добавлен" },
        { status: 400 }
      );
    }

    // Проверяем авторизацию и получаем данные из 1С
    const { get1CUserData } = await import("@/lib/1c-api");
    let data;
    const credentialCheckStartedAt = new Date();
    
    try {
      data = await get1CUserData(
        accountNumber.trim(),
        password1c.trim(),
        regionSafe, undefined, undefined, { bypassCache: true }
      );
      data = normalize1CResponse(data);
      if (!is1CAccountPayload(data)) throw new Error('AUTH_ERROR: Данные счёта не подтверждены');
    } catch (error: any) {
      console.error("Error fetching data from 1C:", error);
      
      // Обрабатываем разные типы ошибок
      if (error.message?.includes("AUTH_ERROR") || error.message?.includes("401") || error.message?.includes("403")) {
        return NextResponse.json(
          { error: "Неверный номер лицевого счета или пароль" },
          { status: 401 }
        );
      }
      
      if (error.message?.includes("TIMEOUT") || error.message?.includes("CONNECTION_REFUSED") || error.message?.includes("NETWORK_ERROR")) {
        return NextResponse.json(
          { 
            error: "Не удалось подключиться к серверу 1С. Возможно, требуется VPN или сервер временно недоступен.",
            details: process.env.NODE_ENV === "development" ? error?.message : undefined
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Ошибка при подключении к 1С. Проверьте правильность данных и попробуйте снова.",
          details: process.env.NODE_ENV === "development" ? error?.message : undefined
        },
        { status: 500 }
      );
    }

    // Извлекаем данные из ответа 1С
    // Структура может отличаться, пробуем разные варианты
    const textValue = (...values: unknown[]) => values.find((value): value is string => typeof value === 'string' && value.trim().length > 0) || null;
    const address = textValue(data.Address, data.address, data.Адрес, data.AddressFull, data.FullAddress) || 'Адрес не указан';
    const name = textValue(data.LSName, data.Name, data.name, data.ФИО, data.Description, data.FullName, data.FIO);
    const phone = textValue(data.Phone, data.phone, data.Телефон, data.PhoneNumber);

    // Получаем счетчики из 1С
    const rawMeters = data.MeteringDevices || data.Devices || data.meters || data.Счетчики || data.DevicesList || [];
    const meters: Record<string, unknown>[] = Array.isArray(rawMeters) ? rawMeters.filter(m => m && typeof m === 'object') : [];
    
    // Создаем лицевой счет
    const account = await prisma.$transaction(async tx => {
      if (regionSafe === 'saki') {
        const key = `${regionSafe}:${accountNumber.trim()}`;
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
        const access = await tx.utilityAccountAccess.findUnique({ where: { key } });
        const recentChange = await tx.utilityPasswordChange.findFirst({ where: { accountKey: key, status: 'COMPLETED', completedAt: { gte: credentialCheckStartedAt } }, select: { id: true } });
        if (access?.pendingChangeId || recentChange) throw new UtilityAccessError('Пароль этого счёта меняется или только что изменён. Повторите привязку с новым паролем.', 409);
      }
      return tx.userAccount.create({
      data: {
        userId: session.user.id,
        accountNumber: accountNumber.trim(),
        address: address,
        name: name,
        phone: phone,
        password1c: encryptPassword1c(password1c.trim()),
        region: regionSafe,
      },
      });
    });

    const meterRows = meters.map((meter: Record<string, unknown>, index: number) => {
      const serialNumber: string =
        (meter.SerialNumber as string) ||
        (meter.Number as string) ||
        (meter.DeviceNumber as string) ||
        (meter.Номер as string) ||
        `Счетчик-${(meter.Number as string) || index + 1}`;
      const serviceName = (meter.ServiceName as string) || (meter.Услуга as string) || "";
      const type = serviceName.toLowerCase().includes("горяч") ? "горячая" : "холодная";
      const lastReading = Number.isFinite(parseMeterNumber(meter.LastReading)) ? parseMeterNumber(meter.LastReading) : null;

      return {
        userId: session.user.id,
        accountId: account.id,
        serialNumber,
        address,
        type,
        lastReading,
      };
    });

    const createdMeters =
      meterRows.length > 0
        ? await prisma.waterMeter.createManyAndReturn({ data: meterRows })
        : [];

    let emailSyncPending = false;
    if (regionSafe === 'saki') {
      try {
        const { syncUtilityAccountEmail } = await import('@/lib/utility-account-email');
        emailSyncPending = await syncUtilityAccountEmail(session.user.id, account.accountNumber, regionSafe) !== 'synced';
      } catch { emailSyncPending = true; }
    }
    return NextResponse.json({
      success: true,
      emailSyncPending,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        address: account.address,
        name: account.name,
        phone: account.phone,
        meters: createdMeters.map(m => ({
          id: m.id,
          serialNumber: m.serialNumber,
          type: m.type,
          address: m.address,
          lastReading: m.lastReading,
        })),
      },
      message: `Успешно загружено счетчиков: ${createdMeters.length}`,
    });
  } catch (error: any) {
    if (error instanceof UtilityAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Error creating account:", error);
    return NextResponse.json(
      { 
        error: "Ошибка при добавлении лицевого счета",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
