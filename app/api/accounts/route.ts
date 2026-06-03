import { NextRequest, NextResponse } from "next/server";
import { withApiRoute } from "@/lib/api-route";
import { getAppSession } from "@/lib/get-app-session";
import { formatUserAccountsForApi } from "@/lib/format-user-accounts";
import { prisma } from "@/lib/prisma";
import { encryptPassword1c } from "@/lib/password1c-crypto";

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
    
    try {
      data = await get1CUserData(
        accountNumber.trim(),
        password1c.trim(),
        regionSafe
      );
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

    // Логируем структуру данных для отладки
    if (process.env.NODE_ENV === "development") {
      console.log("1C API Response structure:", JSON.stringify(data, null, 2));
    }

    // Извлекаем данные из ответа 1С
    // Структура может отличаться, пробуем разные варианты
    const address = data?.Address || data?.address || data?.Адрес || data?.AddressFull || data?.FullAddress || "Адрес не указан";
    const name = data?.Name || data?.name || data?.ФИО || data?.Description || data?.FullName || data?.FIO || null;
    const phone = data?.Phone || data?.phone || data?.Телефон || data?.PhoneNumber || null;

    // Получаем счетчики из 1С
    const meters = data?.MeteringDevices || data?.Devices || data?.meters || data?.Счетчики || data?.DevicesList || [];
    
    if (process.env.NODE_ENV === "development") {
      console.log("Extracted address:", address);
      console.log("Extracted name:", name);
      console.log("Extracted phone:", phone);
      console.log("Extracted meters count:", meters.length);
    }

    // Создаем лицевой счет
    const account = await prisma.userAccount.create({
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

    // Создаем счетчики из данных 1С
    const createdMeters = [];
    for (const meter of meters) {
      const serialNumber: string = meter.SerialNumber || meter.Number || meter.DeviceNumber || meter.Номер || `Счетчик-${meter.Number || createdMeters.length + 1}`;
      const serviceName = meter.ServiceName || meter.Услуга || "";
      const type = serviceName.toLowerCase().includes("горяч") ? "горячая" : "холодная";
      const lastReading = meter.LastReading ? parseFloat(meter.LastReading) : null;

      const createdMeter = await prisma.waterMeter.create({
        data: {
          userId: session.user.id,
          accountId: account.id,
          serialNumber: serialNumber,
          address: address,
          type: type,
          lastReading: lastReading,
        },
      });
      createdMeters.push(createdMeter);
    }

    return NextResponse.json({
      success: true,
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

