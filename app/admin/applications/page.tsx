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
    // Сначала проверяем, есть ли вообще заявки в базе
    const totalCount = await withRetry(() => prisma.application.count());
    console.log("📊 Total applications in database:", totalCount);

    if (totalCount === 0) {
      console.warn("⚠️ WARNING: No applications found in database!");
      console.warn("Checking database connection...");
      
      // Проверяем подключение к базе данных
      try {
        const testQuery = await prisma.user.count();
        console.log("✅ Database connection OK, user count:", testQuery);
        
        // Проверяем, есть ли сервис для технических условий
        const techService = await prisma.service.findUnique({
          where: { id: "tehnologicheskoe-prisoedinenie" },
        });
        console.log("🔍 Technical conditions service:", techService ? "exists" : "NOT FOUND");
      } catch (dbError) {
        console.error("❌ Database connection error:", dbError);
      }
    } else {
      // Если заявки есть, проверяем их детали
      console.log("✅ Found applications in database, checking details...");
      const sampleApp = await prisma.application.findFirst({
        include: {
          service: { select: { id: true, title: true } },
          user: { select: { email: true } },
        },
      });
      console.log("📋 Sample application:", {
        id: sampleApp?.id,
        status: sampleApp?.status,
        serviceId: sampleApp?.service?.id,
        serviceTitle: sampleApp?.service?.title,
        userEmail: sampleApp?.user?.email,
        hasDescription: !!sampleApp?.description,
      });
    }

    const rawApplications = await withRetry(() =>
      prisma.application.findMany({
        include: {
          user: { select: { name: true, email: true, phone: true } },
          service: { select: { id: true, title: true, category: true } },
          // Временно отключено до применения миграции
          // files: {
          //   orderBy: { uploadedAt: "desc" },
          // },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    console.log("📋 Raw applications from database:", {
      count: rawApplications.length,
      expected: totalCount,
      match: rawApplications.length === totalCount,
      firstAppId: rawApplications[0]?.id || "none",
      firstAppStatus: rawApplications[0]?.status || "none",
      firstAppHasService: !!rawApplications[0]?.service,
      firstAppServiceId: rawApplications[0]?.service?.id || "none",
    });

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

    console.log("📤 Admin: Sending to client:", {
      total: applications.length,
      rawCount: rawApplications.length,
      match: applications.length === rawApplications.length,
      applications: applications.map(a => ({
        id: a.id,
        status: a.status,
        serviceTitle: a.service?.title || "no service",
        hasDescription: !!a.description,
        createdAt: typeof a.createdAt === 'string' ? a.createdAt.substring(0, 10) : 'not string',
      })),
    });

    // Проверяем, что данные правильно сериализованы
    if (rawApplications.length > 0 && applications.length === 0) {
      console.error("❌ CRITICAL: Data serialization failed!");
      console.error("Raw applications:", rawApplications.length);
      console.error("Serialized applications:", applications.length);
    }

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

      {/* Отладочная информация на сервере */}
      {applications.length === 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 font-semibold">⚠️ НЕТ ЗАЯВОК НА СЕРВЕРЕ!</p>
          <p className="text-red-600 text-xs mt-1">
            Проверьте логи Vercel для деталей. Возможно, проблема с подключением к базе данных.
          </p>
        </div>
      )}

      <ApplicationsClient applications={applications} categories={categories.map(c => c.category)} />
    </div>
  );
}

