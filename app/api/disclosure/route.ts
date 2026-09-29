import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Search/category depend on this request; do not prerender a shared response.
export const dynamic = "force-dynamic";

// GET - получить все активные документы (публичный доступ)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const where: Prisma.DisclosureDocumentWhereInput = {
      isActive: true,
    };

    // Фильтр по категории
    if (category) {
      where.category = category;
    }

    // Поиск
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { fileName: { contains: search, mode: "insensitive" } },
      ];
    }

    const documents = await prisma.disclosureDocument.findMany({
      where,
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
