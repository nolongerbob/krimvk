import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// PUT - обновить регион
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { name, order, isActive } = body;

    const city = await prisma.waterQualityCity.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
        ...(body.districtId !== undefined && { districtId: body.districtId }),
      },
    });

    return NextResponse.json(city);
  } catch (error) {
    console.error("Error updating region:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении региона" },
      { status: 500 }
    );
  }
}

// DELETE - удалить регион
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    await prisma.waterQualityCity.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting region:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении региона" },
      { status: 500 }
    );
  }
}

