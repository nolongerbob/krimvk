import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// GET - получить все файлы страницы
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // TODO: Добавить модель PageFile в схему Prisma, если нужен функционал загрузки файлов для страниц
    const files: any[] = [];

    return NextResponse.json({ files: [] });
  } catch (error) {
    console.error("Error fetching page files:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке файлов" },
      { status: 500 }
    );
  }
}

// DELETE - удалить файл
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: "ID файла не указан" }, { status: 400 });
    }

    // TODO: Добавить модель PageFile в схему Prisma
    // Временно возвращаем ошибку, так как функционал не реализован
    return NextResponse.json(
      { error: "Функционал загрузки файлов для страниц временно отключен" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error deleting page file:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении файла" },
      { status: 500 }
    );
  }
}

