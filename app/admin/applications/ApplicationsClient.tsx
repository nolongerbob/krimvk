"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, User, Phone, MapPin } from "lucide-react";
import { ApplicationActions } from "@/components/admin/ApplicationActions";
import { ApplicationFilters } from "@/components/admin/ApplicationFilters";
import { ServiceCategoryFilters } from "@/components/admin/ServiceCategoryFilters";
import { TechnicalConditionsApplication } from "@/components/admin/TechnicalConditionsApplication";
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

  // Подсчитываем количество заявок по категориям
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { all: applications.length };
    categories.forEach((category) => {
      counts[category] = applications.filter((app) => app.service.category === category).length;
    });
    return counts;
  }, [applications, categories]);

  // Разделяем заявки на технические условия и обычные
  const { technicalConditionsApps, regularApps } = useMemo(() => {
    const techApps: Application[] = [];
    const regular: Application[] = [];

    applications.forEach((app) => {
      try {
        if (app.description) {
          const data = JSON.parse(app.description);
          if (data && data.type === "technical_conditions") {
            techApps.push(app);
            return;
          }
        }
      } catch (e) {
        // Не JSON, значит обычная заявка
        if (process.env.NODE_ENV === 'development') {
          console.log('Failed to parse description for app:', app.id, e);
        }
      }
      regular.push(app);
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Applications split:', {
        total: applications.length,
        technical: techApps.length,
        regular: regular.length,
        techAppIds: techApps.map(a => a.id),
        techAppStatuses: techApps.map(a => a.status),
      });
    }

    return { technicalConditionsApps: techApps, regularApps: regular };
  }, [applications]);

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

  // Фильтруем заявки на технические условия
  const filteredTechnicalConditions = useMemo(() => {
    let filtered = technicalConditionsApps;

    // Фильтр по статусу
    if (activeFilter === "ALL") {
      // Показываем все технические условия, кроме завершенных (они в отдельном разделе)
      filtered = filtered.filter((app) => app.status !== "COMPLETED");
    } else if (activeFilter === "COMPLETED") {
      // Завершенные технические условия показываются в разделе completedApplications
      filtered = [];
    } else {
      // Показываем только заявки с выбранным статусом
      filtered = filtered.filter((app) => app.status === activeFilter);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Filtered technical conditions:', {
        total: technicalConditionsApps.length,
        filtered: filtered.length,
        activeFilter,
        statuses: technicalConditionsApps.map(a => a.status),
        filteredStatuses: filtered.map(a => a.status),
      });
    }

    return filtered;
  }, [technicalConditionsApps, activeFilter]);

  // Завершенные заявки отдельно (показываются всегда, кроме когда выбран другой фильтр)
  const completedApplications = useMemo(() => {
    if (activeFilter !== "ALL" && activeFilter !== "COMPLETED") {
      return []; // Не показываем завершенные, если выбран другой фильтр
    }
    
    let completed = applications.filter((app) => app.status === "COMPLETED");
    
    // Применяем фильтр по категории к завершенным
    if (activeCategory !== null) {
      completed = completed.filter((app) => app.service.category === activeCategory);
    }
    
    return completed;
  }, [applications, activeFilter, activeCategory]);

  // Разделяем завершенные заявки на технические условия и обычные
  const { completedTechnicalConditions, completedRegular } = useMemo(() => {
    const tech: Application[] = [];
    const regular: Application[] = [];

    completedApplications.forEach((app) => {
      try {
        if (app.description) {
          const data = JSON.parse(app.description);
          if (data && data.type === "technical_conditions") {
            tech.push(app);
            return;
          }
        }
      } catch (e) {
        // Не JSON, значит обычная заявка
      }
      regular.push(app);
    });

    return { completedTechnicalConditions: tech, completedRegular: regular };
  }, [completedApplications]);

  const renderApplication = (app: Application) => {
    const status = statusConfig[app.status as keyof typeof statusConfig];
    const StatusIcon = status.icon;

    // Обрабатываем description - может быть JSON для технических условий
    let displayDescription = app.description || "Без описания";
    try {
      if (app.description) {
        const parsed = JSON.parse(app.description);
        if (parsed.type === "technical_conditions") {
          // Для технических условий показываем краткую информацию
          const fio = [parsed.lastName, parsed.firstName, parsed.middleName].filter(Boolean).join(" ");
          displayDescription = fio ? `ФИО: ${fio}` : "Заявка на технические условия";
          if (parsed.objectAddress) {
            displayDescription += ` | Адрес объекта: ${parsed.objectAddress}`;
          }
        }
      }
    } catch (e) {
      // Не JSON, используем как есть
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
                  <span>{app.user.name || app.user.email}</span>
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

      {/* Заявки на технические условия */}
      {filteredTechnicalConditions.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              Заявки на технические условия
            </h2>
            <p className="text-gray-600 text-sm">
              Всего: {filteredTechnicalConditions.length} (из {technicalConditionsApps.length} всего)
            </p>
          </div>
          <div className="space-y-4">
            {filteredTechnicalConditions.map((app) => (
              <TechnicalConditionsApplication key={app.id} application={app} />
            ))}
          </div>
        </div>
      )}


      {/* Обычные заявки */}
      {filteredApplications.length > 0 && (
        <div className="space-y-4 mb-8">
          {filteredTechnicalConditions.length > 0 && (
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Остальные заявки</h2>
            </div>
          )}
          {filteredApplications.map(renderApplication)}
        </div>
      )}

      {/* Завершенные заявки в отдельном разделе */}
      {activeFilter === "COMPLETED" && completedApplications.length > 0 && (
        <div className="space-y-4">
          {/* Завершенные технические условия */}
          {completedTechnicalConditions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3">Завершенные заявки на технические условия</h3>
              <div className="space-y-4">
                {completedTechnicalConditions.map((app) => (
                  <TechnicalConditionsApplication key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}
          {/* Завершенные обычные заявки */}
          {completedRegular.length > 0 && (
            <div>
              {completedTechnicalConditions.length > 0 && (
                <h3 className="text-xl font-bold mb-3">Остальные завершенные заявки</h3>
              )}
              <div className="space-y-4">
                {completedRegular.map(renderApplication)}
              </div>
            </div>
          )}
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
            {/* Завершенные технические условия */}
            {completedTechnicalConditions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">Завершенные заявки на технические условия</h3>
                <div className="space-y-4">
                  {completedTechnicalConditions.map((app) => (
                    <TechnicalConditionsApplication key={app.id} application={app} />
                  ))}
                </div>
              </div>
            )}
            {/* Завершенные обычные заявки */}
            {completedRegular.length > 0 && (
              <div>
                {completedTechnicalConditions.length > 0 && (
                  <h3 className="text-xl font-bold mb-3">Остальные завершенные заявки</h3>
                )}
                <div className="space-y-4">
                  {completedRegular.map(renderApplication)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {filteredApplications.length === 0 && 
       filteredTechnicalConditions.length === 0 && 
       completedApplications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Нет заявок</p>
          </CardContent>
        </Card>
      )}

      {/* Пустое состояние для активного фильтра */}
      {filteredApplications.length === 0 && 
       filteredTechnicalConditions.length === 0 && 
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

