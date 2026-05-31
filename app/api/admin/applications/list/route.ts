import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export { dynamic } from "@/lib/force-dynamic-route";

// Безопасная функция для парсинга JSON из description
function safeParseDescription(description: string | null): any | null {
  if (!description) return null;
  
  try {
    let jsonPart = description;
    const commentIndex = description.indexOf('\n\nКомментарий при завершении:');
    if (commentIndex !== -1) {
      jsonPart = description.substring(0, commentIndex).trim();
    }
    return JSON.parse(jsonPart);
  } catch (e) {
    // Если JSON не парсится, пробуем извлечь данные регулярками
    const desc = description;
    const extractField = (fieldName: string): string | undefined => {
      const regex = new RegExp(`"${fieldName}":"([^"]*)"`, 'i');
      const match = desc.match(regex);
      return match ? match[1] : undefined;
    };
    
    return {
      lastName: extractField('lastName'),
      firstName: extractField('firstName'),
      middleName: extractField('middleName'),
      objectAddress: extractField('objectAddress'),
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // Загружаем заявки на технологическое присоединение
    const rawApplications = await prisma.application.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Преобразуем в удобный формат для выпадающего списка
    const applications = rawApplications.map((app) => {
      const data = safeParseDescription(app.description);
      
      // Извлекаем ФИО
      let fullName = "";
      if (data) {
        const lastName = data.lastName || "";
        const firstName = data.firstName || "";
        const middleName = data.middleName || "";
        fullName = [lastName, firstName, middleName].filter(Boolean).join(" ");
      }
      if (!fullName) {
        fullName = app.user?.name || app.user?.email || "Без имени";
      }

      // Извлекаем адрес
      const address = data?.objectAddress || app.address || "";

      return {
        id: app.id,
        fullName,
        address,
        phone: app.phone || app.user?.phone || "",
        createdAt: app.createdAt.toISOString(),
        status: app.status,
        serviceTitle: app.service?.title || "",
      };
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching applications list:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке списка заявок" },
      { status: 500 }
    );
  }
}
