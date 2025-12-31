import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const services = await withRetry(() =>
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          price: true,
          isActive: true,
        },
      })
    );

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке услуг" },
      { status: 500 }
    );
  }
}

