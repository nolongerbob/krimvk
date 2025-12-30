import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await request.json();

    // Создаем заявку на технические условия
    // Используем существующую модель Application, но сохраняем все данные в description как JSON
    const applicationData = {
      userId: session.user.id,
      serviceId: "tehnologicheskoe-prisoedinenie", // ID услуги технологического присоединения
      status: "PENDING" as const,
      address: formData.objectAddress || null,
      phone: formData.phone || null,
      description: JSON.stringify({
        type: "technical_conditions",
        personType: formData.personType,
        // Личные данные
        lastName: formData.lastName,
        firstName: formData.firstName,
        middleName: formData.middleName,
        birthDate: formData.birthDate,
        registrationAddress: formData.registrationAddress,
        passportSeries: formData.passportSeries,
        passportNumber: formData.passportNumber,
        passportIssuedBy: formData.passportIssuedBy,
        passportIssueDate: formData.passportIssueDate,
        passportDivisionCode: formData.passportDivisionCode,
        inn: formData.inn,
        snils: formData.snils,
        // Информация об объекте
        objectType: formData.objectType,
        objectPurpose: formData.objectPurpose,
        cadastralNumber: formData.cadastralNumber,
        objectAddress: formData.objectAddress,
        area: formData.area,
        // Параметры присоединения
        connectionTypeWater: formData.connectionTypeWater,
        connectionTypeSewerage: formData.connectionTypeSewerage,
        connectionMethod: formData.connectionMethod,
        requestedLoad: formData.requestedLoad,
        waterSupplyRestriction: formData.waterSupplyRestriction,
        privateNetworkPermission: formData.privateNetworkPermission,
        wellType: formData.wellType,
        connectionPointLocation: formData.connectionPointLocation,
        pipeDiameter: formData.pipeDiameter,
        pipeMaterial: formData.pipeMaterial,
        // Дополнительные поля для официального заявления
        constructionType: formData.constructionType,
        resourceType: formData.resourceType,
        objectHeight: formData.objectHeight,
        objectFloors: formData.objectFloors,
        networkLength: formData.networkLength,
        plannedCommissioningDate: formData.plannedCommissioningDate,
        maxWaterConsumptionLps: formData.maxWaterConsumptionLps,
        maxWaterConsumptionM3h: formData.maxWaterConsumptionM3h,
        maxWaterConsumptionM3day: formData.maxWaterConsumptionM3day,
        fireExtinguishingExternal: formData.fireExtinguishingExternal,
        fireExtinguishingInternal: formData.fireExtinguishingInternal,
        fireHydrantsCount: formData.fireHydrantsCount,
        fireExtinguishingAutomatic: formData.fireExtinguishingAutomatic,
        wastewaterLps: formData.wastewaterLps,
        wastewaterM3h: formData.wastewaterM3h,
        wastewaterM3day: formData.wastewaterM3day,
        notificationMethod: formData.notificationMethod,
        // Файлы
        uploadedFiles: formData.uploadedFiles || [],
      }),
    };

    const application = await prisma.application.create({
      data: applicationData,
      include: {
        service: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    // Обновляем кэш страниц
    revalidatePath("/dashboard/applications");
    revalidatePath("/admin/applications");

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating technical conditions application:", error);
    }
    return NextResponse.json(
      { error: "Ошибка при создании заявки" },
      { status: 500 }
    );
  }
}

