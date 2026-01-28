"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card key={app.id} className={`${status.bgClassName} border-2`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="mb-2">{app.service.title}</CardTitle>
              <CardDescription className="mb-2">{displayDescription}</CardDescription>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {extractFullName(safeParseDescription(app.description), app.user.name, app.user.email)}
                  </span>
                </div>
                {app.user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{app.user.phone}</span>
                  </div>
                )}
                {app.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{app.address}</span>
                  </div>
                )}
                <div>
                  Создана: {new Date(app.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${status.className}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="font-medium">{status.label}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <ApplicationDetails application={app} />
            <ApplicationActions applicationId={app.id} currentStatus={app.status} />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3 text-gray-700">Фильтр по статусу:</h3>
        <ApplicationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={statusCounts}
        />
      </div>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3 text-gray-700">Фильтр по категории услуги:</h3>
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
        <div className="mt-8 pt-8 border-t">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Завершенные заявки
            </h2>
            <p className="text-gray-600 text-sm">
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
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Нет заявок</p>
          </CardContent>
        </Card>
      )}

      {/* Пустое состояние для активного фильтра */}
      {filteredApplications.length === 0 && 
       completedApplications.length > 0 && 
       activeFilter !== "COMPLETED" && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Нет заявок с выбранным статусом</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

