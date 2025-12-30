import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma, withRetry } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const files = await withRetry(() =>
      prisma.applicationFile.findMany({
        where: { applicationId: params.id },
        orderBy: { uploadedAt: "desc" },
      })
    );

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Ошибка при получении файлов" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    );

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "ID файла не указан" }, { status: 400 });
    }

    const file = await withRetry(() =>
      prisma.applicationFile.findUnique({
        where: { id: fileId },
      })
    );

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    // Удаляем файл из базы данных
    await withRetry(() =>
      prisma.applicationFile.delete({
        where: { id: fileId },
      })
    );

    // TODO: Удалить физический файл с диска, если нужно

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении файла" },
      { status: 500 }
    );
  }
}

