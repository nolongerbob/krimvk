import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { ApplicationsClient } from "./ApplicationsClient";

const statusConfig = {
  PENDING: {
    label: "Ожидает обработки",
    icon: Clock,
    className: "text-yellow-500",
    bgClassName: "bg-yellow-50",
  },
  IN_PROGRESS: {
    label: "В работе",
    icon: AlertCircle,
    className: "text-blue-500",
    bgClassName: "bg-blue-50",
  },
  COMPLETED: {
    label: "Завершена",
    icon: CheckCircle,
    className: "text-green-500",
    bgClassName: "bg-green-50",
  },
  CANCELLED: {
    label: "Отменена",
    icon: XCircle,
    className: "text-red-500",
    bgClassName: "bg-red-50",
  },
};

export default async function ApplicationsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/dashboard/applications");
  }

  // Загружаем реальные данные из базы
  type ApplicationWithRelations = Awaited<ReturnType<typeof prisma.application.findMany<{
    include: {
      service: true;
      files: true;
    };
  }>>>;

  let applications: ApplicationWithRelations = [];
  try {
    // Сначала проверяем, сколько всего заявок у пользователя
    const userAppCount = await withRetry(() =>
      prisma.application.count({
        where: { userId: session.user.id },
      })
    );
    console.log("📊 User applications count in database:", userAppCount);

    applications = await withRetry(() =>
      prisma.application.findMany({
        where: { userId: session.user.id },
        include: { 
          service: true,
          files: {
            orderBy: { uploadedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    console.log("📋 User: Loaded applications:", {
      userId: session.user.id,
      expected: userAppCount,
      loaded: applications.length,
      match: applications.length === userAppCount,
      withDescription: applications.filter(a => a.description).length,
      technicalConditions: applications.filter(a => {
        try {
          if (a.description) {
            const parsed = JSON.parse(a.description);
            return parsed.type === "technical_conditions";
          }
        } catch {}
        return false;
      }).length,
      firstApp: applications[0] ? {
        id: applications[0].id,
        status: applications[0].status,
        serviceId: applications[0].service?.id,
        serviceTitle: applications[0].service?.title,
      } : null,
    });

    if (userAppCount > 0 && applications.length === 0) {
      console.error("❌ CRITICAL: Applications exist in database but were not loaded!");
    }
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    applications = [];
  }

  // Преобразуем даты в строки для сериализации
  // Важно: Next.js требует, чтобы все данные были сериализуемы (без Date объектов)
  const serializedApplications = applications.map((app) => {
    try {
      return {
        id: app.id,
        status: app.status,
        description: app.description,
        address: app.address,
        phone: app.phone || null,
        createdAt: app.createdAt instanceof Date ? app.createdAt.toISOString() : String(app.createdAt),
        service: app.service ? {
          id: app.service.id,
          title: app.service.title,
          category: app.service.category || null,
        } : null,
        files: app.files?.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          filePath: file.filePath,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt instanceof Date ? file.uploadedAt.toISOString() : String(file.uploadedAt),
        })) || [],
      };
    } catch (error) {
      console.error("❌ Error serializing application:", app.id, error);
      return null;
    }
  }).filter((app): app is NonNullable<typeof app> => app !== null);

  console.log("📤 Sending to client:", {
    userId: session.user.id,
    total: serializedApplications.length,
    applications: serializedApplications.map(a => ({
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
          <h1 className="text-3xl font-bold mb-2">Мои заявки</h1>
          <p className="text-gray-600">История и статус ваших заявок</p>
        </div>
        <Button asChild>
          <Link href="/services">Подать новую заявку</Link>
        </Button>
      </div>

      <ApplicationsClient applications={serializedApplications as any} />
    </div>
  );
}


