import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - получить все документы (для админа)
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

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
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { title, fileName, fileUrl, fileSize, mimeType, category, order, isActive } = body;

    if (!title || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Необходимо указать название, имя файла и URL" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Необходимо указать категорию документа" },
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
        category: category.trim(),
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

