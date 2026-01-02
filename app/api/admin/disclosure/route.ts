import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - получить все документы (для админа)
export async function GET() {
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

    const documents = await prisma.disclosureDocument.findMany({
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching disclosure documents:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке данных" },
      { status: 500 }
    );
  }
}

// POST - создать новый документ
export async function POST(request: NextRequest) {
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
    const { title, fileName, fileUrl, fileSize, mimeType, order, isActive } = body;

    if (!title || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Необходимо указать название, имя файла и URL" },
        { status: 400 }
      );
    }

    const document = await prisma.disclosureDocument.create({
      data: {
        title: title.trim(),
        fileName,
        fileUrl,
        fileSize: fileSize || 0,
        mimeType: mimeType || "application/octet-stream",
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error creating disclosure document:", error);
    return NextResponse.json(
      { error: "Ошибка при создании документа" },
      { status: 500 }
    );
  }
}

