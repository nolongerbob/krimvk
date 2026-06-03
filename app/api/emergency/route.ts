import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, address, description, userId } = body;

    // Валидация обязательных полей
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Укажите номер телефона" }, { status: 400 });
    }

    if (!address || !address.trim()) {
      return NextResponse.json({ error: "Укажите адрес аварии" }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: "Опишите проблему" }, { status: 400 });
    }

    const phoneTrim = phone.trim();
    const addressTrim = address.trim();
    const descriptionTrim = description.trim();

    if (phoneTrim.length > 32) {
      return NextResponse.json({ error: "Слишком длинный номер телефона" }, { status: 400 });
    }
    if (addressTrim.length > 500) {
      return NextResponse.json({ error: "Слишком длинный адрес" }, { status: 400 });
    }
    if (descriptionTrim.length > 5000) {
      return NextResponse.json({ error: "Слишком длинное описание" }, { status: 400 });
    }
    if (name && name.trim().length > 200) {
      return NextResponse.json({ error: "Слишком длинное имя" }, { status: 400 });
    }
    if (email && email.trim().length > 254) {
      return NextResponse.json({ error: "Слишком длинный email" }, { status: 400 });
    }

    // Если userId указан, проверяем, что пользователь существует
    if (userId) {
      const session = await getServerSession(authOptions);
      if (!session || session.user.id !== userId) {
        return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
      }
    }

    // Создаем сообщение об аварии
    const emergencyReport = await prisma.emergencyReport.create({
      data: {
        name: name?.trim() || null,
        phone: phoneTrim,
        email: email?.trim() || null,
        address: addressTrim,
        description: descriptionTrim,
        userId: userId || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Сообщение об аварии успешно отправлено",
        id: emergencyReport.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating emergency report:", error);
    return NextResponse.json(
      { error: "Ошибка при отправке сообщения об аварии" },
      { status: 500 }
    );
  }
}


