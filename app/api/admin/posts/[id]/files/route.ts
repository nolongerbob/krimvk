import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// GET - получить все файлы поста
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

    const files = await prisma.postFile.findMany({
      where: { postId: params.id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching post files:", error);
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

    const file = await prisma.postFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.postId !== params.id) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    const filePath = join(process.cwd(), "public", file.filePath);

    try {
      await unlink(filePath);
    } catch (err) {
      console.error("Error deleting file from disk:", err);
    }

    await prisma.postFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post file:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении файла" },
      { status: 500 }
    );
  }
}








