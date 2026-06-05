"use client";

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
import { AdminStatTile } from "@/components/admin/AdminStatTile";
import { AdminModuleCard } from "@/components/admin/AdminModuleCard";
import { AdminNotificationsBadge } from "@/components/admin/AdminNotificationsBadge";

export type AdminHomeStats = {
  pendingApplications: number;
  inProgressApplications: number;
  unansweredQuestionsCount: number;
  unpublishedNews: number;
  totalUsers: number;
};

export function AdminHomeDashboard({ stats }: { stats: AdminHomeStats }) {
  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatTile
          title="Новые заявки"
          value={stats.pendingApplications}
          subtitle="Требуют обработки"
          icon={Clock}
          iconClassName="text-amber-600"
          href="/admin/applications?status=PENDING"
        />
        <AdminStatTile
          title="В работе"
          value={stats.inProgressApplications}
          subtitle="Активные заявки"
          icon={AlertCircle}
          iconClassName="text-blue-600"
          href="/admin/applications?status=IN_PROGRESS"
        />
        <AdminStatTile
          title="Вопросы"
          value={stats.unansweredQuestionsCount}
          subtitle="Без ответа"
          icon={MessageSquare}
          iconClassName="text-blue-600"
          href="/admin/questions"
        />
        <AdminStatTile
          title="Новости"
          value={stats.unpublishedNews}
          subtitle="Не опубликовано"
          icon={Newspaper}
          href="/admin/news"
        />
        <AdminStatTile
          title="Пользователи"
          value={stats.totalUsers}
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
    </>
  );
}
