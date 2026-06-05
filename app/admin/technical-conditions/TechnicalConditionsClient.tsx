"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { adminSectionLabelClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { TechnicalConditionsApplication } from "@/components/admin/TechnicalConditionsApplication";
import { Button } from "@/components/ui/button";

type FilterStatus = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface ApplicationFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date | string;
}

interface Application {
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
  files?: ApplicationFile[];
}

interface TechnicalConditionsClientProps {
  applications: Application[];
}

export function TechnicalConditionsClient({ applications }: TechnicalConditionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const statusFromUrl = searchParams.get("status") as FilterStatus | null;
  
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(
    statusFromUrl && ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(statusFromUrl)
      ? statusFromUrl
      : "ALL"
  );

  // Обновляем URL при изменении фильтра
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter !== "ALL") {
      params.set("status", activeFilter);
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `/admin/technical-conditions?${queryString}` : "/admin/technical-conditions";
    
    router.replace(newUrl, { scroll: false });
  }, [activeFilter, router]);

  // Подсчитываем количество заявок по статусам
  const statusCounts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((app) => app.status === "PENDING").length,
      inProgress: applications.filter((app) => app.status === "IN_PROGRESS").length,
      completed: applications.filter((app) => app.status === "COMPLETED").length,
      cancelled: applications.filter((app) => app.status === "CANCELLED").length,
    };
  }, [applications]);

  // Фильтруем заявки по статусу
  const filteredApplications = useMemo(() => {
    if (activeFilter === "ALL") {
      return applications;
    }
    return applications.filter((app) => app.status === activeFilter);
  }, [applications, activeFilter]);

  // Группировка по статусам для отображения
  const pendingApps = filteredApplications.filter((app) => app.status === "PENDING");
  const inProgressApps = filteredApplications.filter((app) => app.status === "IN_PROGRESS");
  const completedApps = filteredApplications.filter((app) => app.status === "COMPLETED");
  const cancelledApps = filteredApplications.filter((app) => app.status === "CANCELLED");

  return (
    <>
      {/* Фильтры по статусу */}
      <div className="mb-6">
        <h3 className={cn("mb-3", adminSectionLabelClass)}>Фильтр по статусу</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("ALL")}
          >
            Все ({statusCounts.all})
          </Button>
          <Button
            variant={activeFilter === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("PENDING")}
            className={activeFilter === "PENDING" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            <Clock className="h-4 w-4 mr-1" />
            Ожидают ({statusCounts.pending})
          </Button>
          <Button
            variant={activeFilter === "IN_PROGRESS" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("IN_PROGRESS")}
            className={activeFilter === "IN_PROGRESS" ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            В работе ({statusCounts.inProgress})
          </Button>
          <Button
            variant={activeFilter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("COMPLETED")}
            className={activeFilter === "COMPLETED" ? "bg-green-500 hover:bg-green-600" : ""}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Завершены ({statusCounts.completed})
          </Button>
        </div>
      </div>

      {/* Заявки сгруппированные по статусам (если выбрано "Все") */}
      {activeFilter === "ALL" ? (
        <>
          {/* Ожидающие обработки */}
          {pendingApps.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-bold text-slate-900">Ожидают обработки ({pendingApps.length})</h2>
              </div>
              <div className="space-y-4">
                {pendingApps.map((app) => (
                  <TechnicalConditionsApplication key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

          {/* В работе */}
          {inProgressApps.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold">В работе ({inProgressApps.length})</h2>
              </div>
              <div className="space-y-4">
                {inProgressApps.map((app) => (
                  <TechnicalConditionsApplication key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

          {/* Завершенные */}
          {completedApps.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h2 className="text-xl font-bold">Завершены ({completedApps.length})</h2>
              </div>
              <div className="space-y-4">
                {completedApps.map((app) => (
                  <TechnicalConditionsApplication key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

          {/* Отмененные */}
          {cancelledApps.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                <h2 className="text-xl font-bold">Отменены ({cancelledApps.length})</h2>
              </div>
              <div className="space-y-4">
                {cancelledApps.map((app) => (
                  <TechnicalConditionsApplication key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Отображение при выбранном фильтре */
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <TechnicalConditionsApplication key={app.id} application={app} />
          ))}
        </div>
      )}

      {/* Пустое состояние */}
      {filteredApplications.length === 0 && (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">
              {activeFilter === "ALL" 
                ? "Нет заявок на технологическое присоединение"
                : "Нет заявок с выбранным статусом"}
            </p>
          </DashboardCardBody>
        </DashboardCard>
      )}
    </>
  );
}
