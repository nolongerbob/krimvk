import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// GET - получить все лицевые счета пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      console.error("No session or user ID");
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("Fetching accounts for user:", userId);
    
    let accounts;
    try {
      accounts = await prisma.userAccount.findMany({
        where: { 
          userId: userId,
          isActive: true,
        },
        include: {
          meters: {
            include: {
              readings: {
                orderBy: { readingDate: "desc" },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      console.log("Found accounts:", accounts.length);
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      console.error("Error code:", dbError?.code);
      console.error("Error meta:", dbError?.meta);
      throw dbError;
    }

    // Простая сериализация
    const formattedAccounts = accounts.map((account) => {
      try {
        const meters = (account.meters || []).map((meter) => {
          const readings = (meter.readings || []).map((reading) => {
            // Безопасная конвертация даты
            let readingDateStr: string;
            try {
              if (!reading.readingDate) {
                readingDateStr = new Date().toISOString();
              } else if (reading.readingDate instanceof Date) {
                readingDateStr = reading.readingDate.toISOString();
              } else {
                readingDateStr = new Date(reading.readingDate).toISOString();
              }
            } catch (e) {
              console.error('Error converting date:', reading.readingDate, e);
              readingDateStr = new Date().toISOString();
            }

            return {
              value: Number(reading.value) || 0,
              readingDate: readingDateStr,
            };
          });

          return {
            id: String(meter.id),
            serialNumber: String(meter.serialNumber || ''),
            type: String(meter.type || ''),
            address: String(meter.address || ''),
            lastReading: meter.lastReading !== null && meter.lastReading !== undefined ? Number(meter.lastReading) : null,
            readings,
          };
        });

        return {
          id: String(account.id),
          accountNumber: String(account.accountNumber || ''),
          address: String(account.address || ''),
          name: account.name ? String(account.name) : null,
          phone: account.phone ? String(account.phone) : null,
          meters,
        };
      } catch (err) {
        console.error('Error formatting account:', account.id, err);
        return null;
      }
    }).filter((acc): acc is NonNullable<typeof acc> => acc !== null);

    console.log("Formatted accounts count:", formattedAccounts.length);
    
    return NextResponse.json({ accounts: formattedAccounts });
  } catch (error: any) {
    console.error("Error fetching accounts:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      { 
        error: "Ошибка при загрузке лицевых счетов",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - добавить новый лицевой счет
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
        region.trim()
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
        password1c: password1c.trim(),
        region: region.trim(),
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

