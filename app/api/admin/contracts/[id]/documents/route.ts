import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export const maxDuration = 300;

// GET - получить все документы договора
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

    const documents = await prisma.contractDocument.findMany({
      where: { contractId: params.id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({
      documents: documents.map((doc) => ({
        ...doc,
        uploadedAt: doc.uploadedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке документов" },
      { status: 500 }
    );
  }
}

// POST - загрузить документ
export async function POST(
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

    // Проверяем существование договора
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
    });

    if (!contract) {
      return NextResponse.json({ error: "Договор не найден" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Файл не найден или пуст" }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: "Тип документа не указан" }, { status: 400 });
    }

    // Проверяем размер файла (макс 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 50MB" },
        { status: 400 }
      );
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `contract_${params.id}_${documentType}_${timestamp}_${originalName}`;
    const filePath = `contracts/${params.id}/${fileName}`;

    // Загружаем файл через абстракцию хранилища
    const result = await storage.upload(file, filePath, {
      contentType: file.type || "application/octet-stream",
      access: "private",
    });

    // Сохраняем информацию о документе в базу данных
    const document = await prisma.contractDocument.create({
      data: {
        contractId: params.id,
        documentType,
        fileName: file.name,
        fileUrl: result.url,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        uploadedAt: document.uploadedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке документа", details: (error as Error).message },
      { status: 500 }
    );
  }
}
