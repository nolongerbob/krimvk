import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { ApplicationsClient } from "./ApplicationsClient";
import { cn } from "@/lib/utils";
import {
  dashboardButtonClass,
  dashboardPageClass,
} from "@/components/dashboard/dashboard-styles";

export default async function ApplicationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/applications");
  }

  type ApplicationWithRelations = Awaited<
    ReturnType<
      typeof prisma.application.findMany<{
        include: {
          service: true;
          files: true;
        };
      }>
    >
  >;

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

  const serializedApplications = applications
    .map((app) => {
      try {
        return {
          id: app.id,
          status: app.status,
          description: app.description,
          address: app.address,
          phone: app.phone || null,
          createdAt:
            app.createdAt instanceof Date
              ? app.createdAt.toISOString()
              : String(app.createdAt),
          service: app.service
            ? {
                id: app.service.id,
                title: app.service.title,
                category: app.service.category || null,
              }
            : null,
          files:
            app.files?.map((file) => ({
              id: file.id,
              fileName: file.fileName,
              filePath: file.filePath,
              fileSize: file.fileSize,
              mimeType: file.mimeType,
              uploadedAt:
                file.uploadedAt instanceof Date
                  ? file.uploadedAt.toISOString()
                  : String(file.uploadedAt),
            })) || [],
        };
      } catch (err) {
        console.error("Error serializing application:", app.id, err);
        return null;
      }
    })
    .filter((app): app is NonNullable<typeof app> => app !== null);

  return (
    <div
      className={cn(
        dashboardPageClass,
        "container max-w-4xl px-4 py-8 [&_button]:!rounded-none"
      )}
    >
      <div className="mb-6">
        <Button
          asChild
          variant="outline"
          size="sm"
          className={cn(dashboardButtonClass, "h-9 border-slate-200")}
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
            Мои заявки
          </h1>
          <p className="text-sm text-slate-600">
            История и статус ваших заявок
          </p>
        </div>
        <Button
          asChild
          className={cn(
            dashboardButtonClass,
            "h-9 shrink-0 rounded-none bg-blue-600 px-5 text-white hover:bg-blue-700"
          )}
        >
          <Link href="/services">Подать новую заявку</Link>
        </Button>
      </div>

      <ApplicationsClient applications={serializedApplications as never} />
    </div>
  );
}
