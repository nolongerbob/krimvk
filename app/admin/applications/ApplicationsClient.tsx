"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { adminSectionLabelClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, User, Phone, MapPin } from "lucide-react";
import { ApplicationActions } from "@/components/admin/ApplicationActions";
import { ApplicationFilters } from "@/components/admin/ApplicationFilters";
import { ServiceCategoryFilters } from "@/components/admin/ServiceCategoryFilters";
import { ApplicationDetails } from "@/components/admin/ApplicationDetails";

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

interface ApplicationsClientProps {
  applications: Application[];
  categories: string[];
}

const statusConfig = {
  PENDING: {
    label: "Ожидает обработки",
    icon: Clock,
    tagClass: "bg-amber-50 text-amber-800",
  },
  IN_PROGRESS: {
    label: "В работе",
    icon: AlertCircle,
    tagClass: "bg-blue-50 text-blue-700",
  },
  COMPLETED: {
    label: "Завершена",
    icon: CheckCircle,
    tagClass: "bg-emerald-50 text-emerald-700",
  },
  CANCELLED: {
    label: "Отменена",
    icon: XCircle,
    tagClass: "bg-slate-100 text-slate-600",
  },
};

// Безопасная функция для парсинга JSON из description с учетом комментариев администратора
function safeParseDescription(description: string | null): any | null {
  if (!description) return null;
  
  try {
    // Извлекаем JSON часть, если есть комментарий администратора
    let jsonPart = description;
    const commentIndex = description.indexOf('\n\nКомментарий при завершении:');
    if (commentIndex !== -1) {
      jsonPart = description.substring(0, commentIndex).trim();
    }
    
    return JSON.parse(jsonPart);
  } catch (e) {
    return null;
  }
}

// Функция для извлечения полного имени из данных заявки
function extractFullName(data: any | null, fallbackName: string | null, fallbackEmail: string): string {
  if (data) {
    // Проверяем наличие полей ФИО (могут быть пустыми строками, null, undefined)
    const lastName = (data.lastName && typeof data.lastName === 'string') ? data.lastName.trim() : "";
    const firstName = (data.firstName && typeof data.firstName === 'string') ? data.firstName.trim() : "";
    const middleName = (data.middleName && typeof data.middleName === 'string') ? data.middleName.trim() : "";
    
    // Временное логирование для отладки
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[extractFullName] Debug:', {
        hasData: !!data,
        rawLastName: data.lastName,
        rawFirstName: data.firstName,
        rawMiddleName: data.middleName,
        lastName,
        firstName,
        middleName,
        fallbackName,
        fallbackEmail
      });
    }
    
    // Если есть хотя бы фамилия или имя, формируем ФИО
    if (lastName || firstName) {
      const fullName = `${lastName} ${firstName} ${middleName}`.trim();
      if (fullName) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('[extractFullName] Returning fullName from data:', fullName);
        }
        return fullName;
      }
    }
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[extractFullName] Returning fallback:', fallbackName || fallbackEmail);
  }
  return fallbackName || fallbackEmail;
}

export function ApplicationsClient({ applications, categories }: ApplicationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  
  // Читаем фильтры из URL параметров при загрузке
  const statusFromUrl = searchParams.get("status") as FilterStatus | null;
  const categoryFromUrl = searchParams.get("category");
  
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(
    statusFromUrl && ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(statusFromUrl)
      ? statusFromUrl
      : "ALL"
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categoryFromUrl && categories.includes(categoryFromUrl) ? categoryFromUrl : null
  );

  // Обновляем URL при изменении фильтров (без перезагрузки страницы)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter !== "ALL") {
      params.set("status", activeFilter);
    }
    if (activeCategory !== null) {
      params.set("category", activeCategory);
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `/admin/applications?${queryString}` : "/admin/applications";
    
    // Обновляем URL без перезагрузки страницы
    router.replace(newUrl, { scroll: false });
  }, [activeFilter, activeCategory, router]);

  // Фильтруем только обычные заявки (без технологического присоединения)
  const regularApps = useMemo(() => {
    return applications.filter((app) => {
      // Проверяем по JSON в description
      const data = safeParseDescription(app.description);
      if (data && data.type === "technical_conditions") {
        return false; // Исключаем технические условия
      }
      
      // Проверяем по названию услуги
      const titleLower = app.service.title.toLowerCase();
      if (titleLower.includes("технологическое присоединение") || 
          titleLower.includes("технические условия")) {
        return false; // Исключаем технические условия
      }
      
      return true;
    });
  }, [applications]);

  // Подсчитываем количество заявок по статусам (только обычные заявки)
  const statusCounts = useMemo(() => {
    return {
      all: regularApps.length,
      pending: regularApps.filter((app) => app.status === "PENDING").length,
      inProgress: regularApps.filter((app) => app.status === "IN_PROGRESS").length,
      completed: regularApps.filter((app) => app.status === "COMPLETED").length,
      cancelled: regularApps.filter((app) => app.status === "CANCELLED").length,
    };
  }, [regularApps]);

  // Подсчитываем количество заявок по категориям (только обычные заявки)
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { all: regularApps.length };
    categories.forEach((category) => {
      counts[category] = regularApps.filter((app) => app.service.category === category).length;
    });
    return counts;
  }, [regularApps, categories]);

  // Фильтруем заявки по статусу и категории
  const filteredApplications = useMemo(() => {
    let filtered = regularApps;

    // Фильтр по статусу
    if (activeFilter === "ALL") {
      // Показываем все, кроме завершенных (они в отдельном разделе)
      filtered = filtered.filter((app) => app.status !== "COMPLETED");
    } else if (activeFilter === "COMPLETED") {
      // Если выбран фильтр "Завершенные", возвращаем пустой массив (они показываются отдельно)
      filtered = [];
    } else {
      filtered = filtered.filter((app) => app.status === activeFilter);
    }

    // Фильтр по категории
    if (activeCategory !== null) {
      filtered = filtered.filter((app) => app.service.category === activeCategory);
    }

    return filtered;
  }, [regularApps, activeFilter, activeCategory]);

  // Завершенные заявки отдельно (показываются всегда, кроме когда выбран другой фильтр)
  const completedApplications = useMemo(() => {
    if (activeFilter !== "ALL" && activeFilter !== "COMPLETED") {
      return []; // Не показываем завершенные, если выбран другой фильтр
    }
    
    let completed = regularApps.filter((app) => app.status === "COMPLETED");
    
    // Применяем фильтр по категории к завершенным
    if (activeCategory !== null) {
      completed = completed.filter((app) => app.service.category === activeCategory);
    }
    
    return completed;
  }, [regularApps, activeFilter, activeCategory]);

  const renderApplication = (app: Application) => {
    const status = statusConfig[app.status as keyof typeof statusConfig];
    const StatusIcon = status.icon;

    // Обрабатываем description
    let displayDescription = app.description || "Без описания";
    const parsed = safeParseDescription(app.description);
    
    if (!parsed && displayDescription.length > 200) {
      displayDescription = displayDescription.substring(0, 200) + "...";
    }

    return (
      <DashboardCard key={app.id}>
        <DashboardCardBody className="p-0">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{app.service.title}</h3>
                <p className="mb-3 text-sm text-slate-600">{displayDescription}</p>
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 shrink-0" />
                    <span>
                      {extractFullName(safeParseDescription(app.description), app.user.name, app.user.email)}
                    </span>
                  </div>
                  {app.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{app.user.phone}</span>
                    </div>
                  )}
                  {app.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{app.address}</span>
                    </div>
                  )}
                  <div>
                    Создана: {new Date(app.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 text-xs font-medium",
                  status.tagClass
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-6 py-4">
            <ApplicationDetails application={app} />
            <ApplicationActions applicationId={app.id} currentStatus={app.status} />
          </div>
        </DashboardCardBody>
      </DashboardCard>
    );
  };

  return (
    <>
      <div className="mb-6">
        <h3 className={cn("mb-3", adminSectionLabelClass)}>Фильтр по статусу</h3>
        <ApplicationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={statusCounts}
        />
      </div>
      
      <div className="mb-6">
        <h3 className={cn("mb-3", adminSectionLabelClass)}>Фильтр по категории услуги</h3>
        <ServiceCategoryFilters
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          counts={categoryCounts}
        />
      </div>

      {/* Заявки */}
      {filteredApplications.length > 0 && (
        <div className="space-y-4 mb-8">
          {filteredApplications.map(renderApplication)}
        </div>
      )}

      {/* Завершенные заявки в отдельном разделе */}
      {activeFilter === "COMPLETED" && completedApplications.length > 0 && (
        <div className="space-y-4">
          {completedApplications.map(renderApplication)}
        </div>
      )}

      {/* Завершенные заявки в отдельном разделе (когда выбран "Все") */}
      {activeFilter === "ALL" && completedApplications.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-8">
          <div className="mb-4">
            <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
              Завершенные заявки
            </h2>
            <p className="text-sm text-slate-500">
              Всего завершено: {completedApplications.length}
            </p>
          </div>
          <div className="space-y-4">
            {completedApplications.map(renderApplication)}
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {filteredApplications.length === 0 && completedApplications.length === 0 && (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Нет заявок</p>
          </DashboardCardBody>
        </DashboardCard>
      )}

      {filteredApplications.length === 0 && 
       completedApplications.length > 0 && 
       activeFilter !== "COMPLETED" && (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Нет заявок с выбранным статусом</p>
          </DashboardCardBody>
        </DashboardCard>
      )}
    </>
  );
}

