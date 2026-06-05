import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { AdminStatTile } from "@/components/admin/AdminStatTile";
import { AdminModuleCard } from "@/components/admin/AdminModuleCard";
import { AdminNotificationsBadge } from "@/components/admin/AdminNotificationsBadge";
import { adminContainerClass } from "@/components/admin/admin-styles";
import {
  FileText,
  MessageSquare,
  Newspaper,
  Users,
  AlertCircle,
  Clock,
  Settings,
  Droplet,
  FileCheck,
  CreditCard,
} from "lucide-react";

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

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatTile
          title="Новые заявки"
          value={pendingApplications}
          subtitle="Требуют обработки"
          icon={Clock}
          iconClassName="text-amber-600"
          href="/admin/applications?status=PENDING"
        />
        <AdminStatTile
          title="В работе"
          value={inProgressApplications}
          subtitle="Активные заявки"
          icon={AlertCircle}
          iconClassName="text-blue-600"
          href="/admin/applications?status=IN_PROGRESS"
        />
        <AdminStatTile
          title="Вопросы"
          value={unansweredQuestionsCount}
          subtitle="Без ответа"
          icon={MessageSquare}
          iconClassName="text-blue-600"
          href="/admin/questions"
        />
        <AdminStatTile
          title="Новости"
          value={unpublishedNews}
          subtitle="Не опубликовано"
          icon={Newspaper}
          href="/admin/news"
        />
        <AdminStatTile
          title="Пользователи"
          value={totalUsers}
          subtitle="Всего"
          icon={Users}
          href="/admin/users"
        />
      </div>

      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Разделы
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminModuleCard
          href="/admin/applications"
          title="Управление заявками"
          description="Просмотр и обработка заявок"
          icon={FileText}
          iconClassName="text-blue-600"
          badge={<AdminNotificationsBadge type="applications" />}
        />
        <AdminModuleCard
          href="/admin/technical-conditions"
          title="Технологическое присоединение"
          description="Заявки на технические условия"
          icon={Settings}
          iconClassName="text-blue-600"
          badge={<AdminNotificationsBadge type="applications" />}
        />
        <AdminModuleCard
          href="/admin/questions"
          title="Вопросы и ответы"
          description="Ответы на вопросы пользователей"
          icon={MessageSquare}
          iconClassName="text-blue-600"
          badge={<AdminNotificationsBadge type="questions" />}
        />
        <AdminModuleCard
          href="/admin/news"
          title="Управление новостями"
          description="Создание и публикация новостей"
          icon={Newspaper}
        />
        <AdminModuleCard
          href="/admin/users"
          title="Пользователи"
          description="Управление пользователями"
          icon={Users}
        />
        <AdminModuleCard
          href="/admin/water-quality"
          title="Качество питьевой воды"
          description="Управление разделами, годами и документами"
          icon={Droplet}
          iconClassName="text-blue-600"
        />
        <AdminModuleCard
          href="/admin/disclosure"
          title="Раскрытие информации"
          description="Управление документами раскрытия информации"
          icon={FileText}
        />
        <AdminModuleCard
          href="/admin/contracts"
          title="Договоры"
          description="Создание договоров и управление пользователями"
          icon={FileCheck}
        />
        <AdminModuleCard
          href="/admin/direct-account"
          title="Работа с лицевым счетом"
          description="Прямой доступ к л/с в 1С: квитанция, показания, платежи"
          icon={CreditCard}
        />
      </div>
    </div>
  );
}
