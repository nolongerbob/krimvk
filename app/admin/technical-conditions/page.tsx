import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { adminContainerClass } from "@/components/admin/admin-styles";
import { TechnicalConditionsClient } from "./TechnicalConditionsClient";

export const dynamic = 'force-dynamic';

export default async function AdminTechnicalConditionsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/technical-conditions");
  }

  let user;
  try {
    user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    );
  } catch (error) {
    console.error("Failed to fetch user:", error);
    redirect("/dashboard");
  }

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем заявки на технологическое присоединение
  type ApplicationWithRelations = {
    id: string;
    status: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    createdAt: Date | string;
    user: {
      name: string | null;
      email: string;
      phone: string | null;
    };
    service: {
      id: string;
      title: string;
      category: string;
    };
    files?: Array<{
      id: string;
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: Date | string;
    }>;
  };

  let applications: ApplicationWithRelations[] = [];
  
  try {
    const rawApplications = await withRetry(() =>
      prisma.application.findMany({
        include: {
          user: { select: { name: true, email: true, phone: true } },
          service: { select: { id: true, title: true, category: true } },
          files: {
            orderBy: { uploadedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    // Фильтруем только заявки на технические условия
    const technicalApplications = rawApplications.filter((app) => {
      // Проверяем по JSON в description
      if (app.description) {
        try {
          let jsonPart = app.description;
          const commentIndex = app.description.indexOf('\n\nКомментарий при завершении:');
          if (commentIndex !== -1) {
            jsonPart = app.description.substring(0, commentIndex).trim();
          }
          const data = JSON.parse(jsonPart);
          if (data && data.type === "technical_conditions") {
            return true;
          }
        } catch (e) {
          // Не JSON, проверяем по названию услуги
        }
      }
      
      // Проверяем по названию услуги
      const titleLower = app.service.title.toLowerCase();
      if (titleLower.includes("технологическое присоединение") || 
          titleLower.includes("технические условия")) {
        return true;
      }
      
      return false;
    });

    // Сериализуем даты
    applications = technicalApplications.map((app) => {
      try {
        return {
          id: app.id,
          status: app.status,
          description: app.description,
          address: app.address,
          phone: app.phone,
          createdAt: app.createdAt instanceof Date ? app.createdAt.toISOString() : String(app.createdAt),
          user: app.user,
          service: app.service,
          files: app.files?.map((file: any) => ({
            id: file.id,
            fileName: file.fileName,
            filePath: file.filePath,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            uploadedAt: file.uploadedAt instanceof Date ? file.uploadedAt.toISOString() : String(file.uploadedAt),
          })) || [],
        } as ApplicationWithRelations;
      } catch (error) {
        console.error("Error serializing application:", app.id, error);
        return null;
      }
    }).filter((app): app is ApplicationWithRelations => app !== null);

  } catch (error) {
    console.error("Failed to fetch applications:", error);
    applications = [];
  }


  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Технологическое присоединение"
        description="Заявки на выдачу технических условий"
        actions={<AutoRefresh interval={15} />}
      />
      <TechnicalConditionsClient applications={applications} />
    </div>
  );
}
