import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 50MB" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Недопустимый тип файла. Разрешены: PDF, DOC, DOCX" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `contract_${timestamp}_${originalName}`;
    const filePath = `contracts/${fileName}`;

    const result = await storage.upload(file, filePath, {
      contentType: file.type || "application/pdf",
      access: "private",
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Error uploading contract file:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}
