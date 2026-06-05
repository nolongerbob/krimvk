import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { adminContainerClass } from "@/components/admin/admin-styles";
import { ApplicationsClient } from "./ApplicationsClient";

export default async function AdminApplicationsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/applications");
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

  // Загружаем все заявки с обработкой ошибок
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

  type CategoryResult = {
    category: string;
  };

  let applications: ApplicationWithRelations[] = [];
  let categories: CategoryResult[] = [];
  
  try {
    // Загружаем заявки из базы данных

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

    // Сериализуем даты для передачи в клиентский компонент
    // Важно: Next.js требует, чтобы все данные были сериализуемы (без Date объектов)
    applications = rawApplications.map((app) => {
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
        console.error("❌ Error serializing application:", app.id, error);
        return null;
      }
    }).filter((app): app is ApplicationWithRelations => app !== null);


    // Получаем уникальные категории услуг
    categories = await withRetry(() =>
      prisma.service.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ["category"],
      })
    );
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    // Возвращаем пустые массивы, чтобы страница не упала
    applications = [];
    categories = [];
  }


  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Управление заявками"
        description="Обработка заявок пользователей"
        actions={<AutoRefresh interval={15} />}
      />
      <ApplicationsClient applications={applications} categories={categories.map(c => c.category)} />
    </div>
  );
}

