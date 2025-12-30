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
  } catch (error) {
    console.error("Error fetching applications:", error);
    applications = [];
  }

  // Преобразуем даты в строки для сериализации
  const serializedApplications = applications.map((app) => ({
    ...app,
    createdAt: app.createdAt instanceof Date ? app.createdAt.toISOString() : app.createdAt,
    files: app.files?.map((file) => ({
      ...file,
      uploadedAt: file.uploadedAt instanceof Date ? file.uploadedAt.toISOString() : file.uploadedAt,
    })) || [],
  }));

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


