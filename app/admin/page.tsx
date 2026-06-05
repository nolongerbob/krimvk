import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { AdminHomeDashboard } from "@/components/admin/AdminHomeDashboard";
import { adminContainerClass } from "@/components/admin/admin-styles";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin");
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
    return (
      <div className={adminContainerClass}>
        <DashboardCard className="border-red-200 bg-red-50">
          <DashboardCardBody>
            <h1 className="mb-2 text-2xl font-bold text-red-800">
              Ошибка подключения к базе данных
            </h1>
            <p className="text-red-600">
              Не удалось подключиться к базе данных. Пожалуйста, попробуйте позже.
            </p>
          </DashboardCardBody>
        </DashboardCard>
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    pendingApplications,
    inProgressApplications,
    unansweredQuestionsCount,
    unpublishedNews,
    totalUsers,
  ] = await Promise.allSettled([
    withRetry(() => prisma.application.count({ where: { status: "PENDING" } })),
    withRetry(() => prisma.application.count({ where: { status: "IN_PROGRESS" } })),
    withRetry(() => prisma.question.count({ 
      where: { 
        status: "PENDING",
        messages: {
          some: {
            isFromAdmin: false,
          },
          none: {
            isFromAdmin: true,
          },
        },
      },
    })),
    withRetry(() => prisma.news.count({ where: { published: false } })),
    withRetry(() => prisma.user.count({ where: { role: "USER" } })),
  ]).then((results) => {
    return results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error("Error loading statistics:", result.reason);
        return 0;
      }
    });
  });

  return (
    <div className={adminContainerClass}>
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">
          Админ-панель
        </h1>
        <p className="text-slate-600">Управление системой</p>
      </div>

      <AdminHomeDashboard
        stats={{
          pendingApplications,
          inProgressApplications,
          unansweredQuestionsCount,
          unpublishedNews,
          totalUsers,
        }}
      />
    </div>
  );
}
