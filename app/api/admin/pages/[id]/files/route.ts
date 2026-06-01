import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// GET - получить все файлы страницы
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

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
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

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

