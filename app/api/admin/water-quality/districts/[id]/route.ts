import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// PUT - обновить район
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { name, order, isActive } = body;

    const district = await prisma.waterQualityDistrict.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(district);
  } catch (error) {
    console.error("Error updating district:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении района" },
      { status: 500 }
    );
  }
}

// DELETE - удалить район
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    await prisma.waterQualityDistrict.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting district:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении района" },
      { status: 500 }
    );
  }
}

