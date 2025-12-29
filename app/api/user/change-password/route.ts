import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth";

/**
 * POST - изменить пароль пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Текущий и новый пароль обязательны" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен содержать минимум 6 символов" },
        { status: 400 }
      );
    }

    // Получаем пользователя с паролем
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Проверяем, что у пользователя есть пароль (не OAuth пользователь)
    if (!user.password) {
      return NextResponse.json(
        { error: "Вы не можете изменить пароль, так как вы зарегистрированы через Госуслуги" },
        { status: 400 }
      );
    }

    // Проверяем текущий пароль
    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Неверный текущий пароль" },
        { status: 401 }
      );
    }

    // Хешируем новый пароль
    const hashedPassword = await hashPassword(newPassword);

    // Обновляем пароль
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Пароль успешно изменен",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error changing password:", error);
    }
    return NextResponse.json(
      { error: "Ошибка при изменении пароля" },
      { status: 500 }
    );
  }
}

