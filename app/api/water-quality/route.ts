import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - получить все регионы с годами и документами (публичный доступ)
export async function GET() {
  try {
    const regions = await prisma.waterQualityRegion.findMany({
      where: {
        isActive: true,
      },
      include: {
        years: {
          where: {
            isActive: true,
          },
          include: {
            documents: {
              orderBy: { uploadedAt: "desc" },
            },
          },
          orderBy: { year: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(regions);
  } catch (error) {
    console.error("Error fetching water quality data:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке данных" },
      { status: 500 }
    );
  }
}

