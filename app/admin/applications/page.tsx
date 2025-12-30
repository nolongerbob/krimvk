import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
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
    createdAt: Date;
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
      uploadedAt: Date;
    }>;
  };

  type CategoryResult = {
    category: string;
  };

  let applications: ApplicationWithRelations[] = [];
  let categories: CategoryResult[] = [];
  
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

    console.log("📋 Admin: Loaded applications:", {
      total: rawApplications.length,
      withDescription: rawApplications.filter(a => a.description).length,
      technicalConditions: rawApplications.filter(a => {
        try {
          if (a.description) {
            const parsed = JSON.parse(a.description);
            return parsed.type === "technical_conditions";
          }
        } catch {}
        return false;
      }).length,
      firstApp: rawApplications[0] ? {
        id: rawApplications[0].id,
        status: rawApplications[0].status,
        hasDescription: !!rawApplications[0].description,
      } : null,
    });

    // Сериализуем даты для передачи в клиентский компонент
    applications = rawApplications.map((app) => ({
      ...app,
      createdAt: app.createdAt instanceof Date ? app.createdAt.toISOString() : app.createdAt,
      files: app.files?.map((file: any) => ({
        ...file,
        uploadedAt: file.uploadedAt instanceof Date ? file.uploadedAt.toISOString() : file.uploadedAt,
      })) || [],
    })) as ApplicationWithRelations[];

    console.log("📤 Admin: Sending to client:", {
      total: applications.length,
      applications: applications.map(a => ({
        id: a.id,
        status: a.status,
        serviceTitle: a.service?.title || "no service",
        hasDescription: !!a.description,
        createdAt: a.createdAt,
      })),
    });

    // Получаем уникальные категории услуг
    categories = await withRetry(() =>
      prisma.service.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ["category"],
      })
    );
  } catch (error) {
    console.error("❌ Failed to fetch applications:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    // Возвращаем пустые массивы, чтобы страница не упала
    applications = [];
    categories = [];
  }

  console.log("📤 Admin: Final applications before sending:", {
    total: applications.length,
    applications: applications.map(a => ({
      id: a.id,
      status: a.status,
      serviceTitle: a.service?.title || "no service",
      hasDescription: !!a.description,
    })),
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление заявками</h1>
          <p className="text-gray-600">Обработка заявок пользователей</p>
        </div>
        <div className="flex items-center gap-4">
          <AutoRefresh interval={15} />
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      <ApplicationsClient applications={applications} categories={categories.map(c => c.category)} />
    </div>
  );
}

