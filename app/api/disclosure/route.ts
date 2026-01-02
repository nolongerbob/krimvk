import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - получить все активные документы (публичный доступ)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const documents = await prisma.disclosureDocument.findMany({
      where: {
        isActive: true,
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { fileName: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
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
