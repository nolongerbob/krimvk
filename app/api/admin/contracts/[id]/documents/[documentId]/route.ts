import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// DELETE - удалить документ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
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

    // Проверяем, что документ принадлежит этому договору
    const document = await prisma.contractDocument.findUnique({
      where: { id: params.documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
    }

    if (document.contractId !== params.id) {
      return NextResponse.json(
        { error: "Документ не принадлежит этому договору" },
        { status: 403 }
      );
    }

    // Удаляем документ
    await prisma.contractDocument.delete({
      where: { id: params.documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении документа", details: (error as Error).message },
      { status: 500 }
    );
  }
}
