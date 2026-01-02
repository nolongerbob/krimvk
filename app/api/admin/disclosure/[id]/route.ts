import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export const dynamic = 'force-dynamic';

// PUT - обновить документ
export async function PUT(
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

    const body = await request.json();
    const { title, order, isActive } = body;

    const document = await prisma.disclosureDocument.update({
      where: { id: params.id },
      data: {
        ...(title && { title: title.trim() }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error updating disclosure document:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении документа" },
      { status: 500 }
    );
  }
}

// DELETE - удалить документ
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

    // Получаем документ для удаления файла
    const document = await prisma.disclosureDocument.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
    }

    // Удаляем файл из хранилища
    try {
      await storage.delete(document.fileUrl);
    } catch (error) {
      console.warn("Error deleting file from storage:", error);
      // Продолжаем удаление даже если файл не найден
    }

    // Удаляем запись из базы данных
    await prisma.disclosureDocument.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting disclosure document:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении документа" },
      { status: 500 }
    );
  }
}

