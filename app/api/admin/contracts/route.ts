import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
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

    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке договоров" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const data = await request.json();

    // Создаем договор без привязки к пользователю (userId опциональный)
    const contract = await prisma.contract.create({
      data: {
        userId: null,
        contractNumber: data.contractNumber || "",
        contractDate: data.contractDate || null,
        lastName: data.lastName || "",
        firstName: data.firstName || "",
        middleName: data.middleName || null,
        birthDate: data.birthDate || null,
        registrationAddress: data.registrationAddress || null,
        passportSeries: data.passportSeries || null,
        passportNumber: data.passportNumber || null,
        passportIssuedBy: data.passportIssuedBy || null,
        passportIssueDate: data.passportIssueDate || null,
        passportDivisionCode: data.passportDivisionCode || null,
        phone: data.phone || null,
        objectType: data.objectType || null,
        objectPurpose: data.objectPurpose || null,
        cadastralNumber: data.cadastralNumber || null,
        objectAddress: data.objectAddress || null,
        objectArea: data.objectArea || null,
        siteMaster: data.siteMaster || null,
        position: data.position || null,
        objectBasis: data.objectBasis || null,
        hasWaterSupply: data.hasWaterSupply || false,
        hasSewerage: data.hasSewerage || false,
        connectionType: data.connectionType || null,
        wellType: data.wellType || null,
        requestedLoad: data.requestedLoad || null,
        connectionPoint: data.connectionPoint || null,
        pipeDiameter: data.pipeDiameter || null,
        pipeMaterial: data.pipeMaterial || null,
        waterSupplyRestriction: data.waterSupplyRestriction || false,
        privateNetworkPermission: data.privateNetworkPermission || false,
        receiptDate: data.receiptDate || null,
        technicalConditionsIssueDate: data.technicalConditionsIssueDate || null,
        technicalConditionsNumber: data.technicalConditionsNumber || null,
        connectionAgreementIssueDate: data.connectionAgreementIssueDate || null,
        connectionAgreementNumber: data.connectionAgreementNumber || null,
        designAgreementIssueDate: data.designAgreementIssueDate || null,
        designAgreementNumber: data.designAgreementNumber || null,
        costWithVAT: data.costWithVAT || null,
        contractFileUrl: data.contractFileUrl || null,
        contractFileName: data.contractFileName || null,
        contractFileSize: data.contractFileSize || null,
        contractFileMimeType: data.contractFileMimeType || null,
      },
    });

    revalidatePath("/admin/contracts");

    return NextResponse.json({ success: true, contract }, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Ошибка при создании договора" },
      { status: 500 }
    );
  }
}
