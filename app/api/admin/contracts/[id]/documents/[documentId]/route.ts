import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// DELETE - удалить документ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

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
