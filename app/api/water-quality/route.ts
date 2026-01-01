import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - получить все районы с городами, годами и документами (публичный доступ)
export async function GET() {
  try {
    const districts = await prisma.waterQualityDistrict.findMany({
      where: {
        isActive: true,
      },
      include: {
        cities: {
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
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(districts);
  } catch (error) {
    console.error("Error fetching water quality data:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке данных" },
      { status: 500 }
    );
  }
}

