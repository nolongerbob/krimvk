import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma, withRetry } from "@/lib/prisma";

// Изменение роли пользователя
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Не указан ID пользователя или роль" },
        { status: 400 }
      );
    }

    // Проверяем валидность роли
    if (!["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Неверная роль. Допустимые значения: USER, ADMIN" },
        { status: 400 }
      );
    }

    // Нельзя изменить свою роль
    if (userId === auth.admin.userId) {
      return NextResponse.json(
        { error: "Нельзя изменить свою собственную роль" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь
    const targetUser = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true },
      })
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Обновляем роль пользователя
    const updatedUser = await withRetry(() =>
      prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      })
    );

    console.log(
      `[Role Change] User ${auth.admin.email} changed role of ${targetUser.email} from ${targetUser.role} to ${role}`
    );

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Роль пользователя ${updatedUser.email} изменена на ${
        role === "ADMIN" ? "Администратор" : "Пользователь"
      }`,
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    return NextResponse.json(
      { error: "Ошибка при изменении роли пользователя" },
      { status: 500 }
    );
  }
}

// Получение списка всех администраторов
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    // Получаем список всех администраторов
    const admins = await withRetry(() =>
      prisma.user.findMany({
        where: { role: "ADMIN" },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      })
    );

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка администраторов" },
      { status: 500 }
    );
  }
}
