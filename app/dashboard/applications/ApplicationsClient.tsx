"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, X, Download } from "lucide-react";
import Link from "next/link";

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

interface ApplicationFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

interface Application {
  id: string;
  service: {
    title: string;
  };
  description: string | null;
  address: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  files?: ApplicationFile[];
}

interface ApplicationsClientProps {
  applications: Application[];
}

export function ApplicationsClient({ applications: initialApplications }: ApplicationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState(initialApplications);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusChangeNotification, setStatusChangeNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "info";
  } | null>(null);

  // Показываем уведомление если заявка только что создана
  const created = searchParams.get("created");
  
  // Отслеживаем изменения статуса заявок при обновлении данных
  useEffect(() => {
    // Сравниваем текущие заявки с новыми, чтобы обнаружить изменения статуса
    initialApplications.forEach((newApp) => {
      const oldApp = applications.find((a) => a.id === newApp.id);
      if (oldApp && oldApp.status !== newApp.status) {
        // Статус изменился
        const statusLabels: Record<string, string> = {
          PENDING: "Ожидает обработки",
          IN_PROGRESS: "В работе",
          COMPLETED: "Завершена",
          CANCELLED: "Отменена",
        };
        setStatusChangeNotification({
          show: true,
          message: `Статус заявки "${newApp.service.title}" изменен на "${statusLabels[newApp.status] || newApp.status}"`,
          type: newApp.status === "COMPLETED" ? "success" : "info",
        });
        // Скрываем уведомление через 5 секунд
        setTimeout(() => {
          setStatusChangeNotification(null);
        }, 5000);
      }
    });
    // Обновляем список заявок
    setApplications(initialApplications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialApplications]);

  // Обновляем данные при монтировании компонента, если заявка только что создана
  useEffect(() => {
    if (created === "true") {
      // Обновляем данные с сервера
      router.refresh();
      // Обновляем статистику на дашборде
      window.dispatchEvent(new Event("stats-update"));
      // Убираем параметр из URL через 5 секунд (после показа уведомления)
      const timer = setTimeout(() => {
        router.replace("/dashboard/applications", { scroll: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [created, router]);

  const handleCancel = async (applicationId: string) => {
    if (!confirm("Вы уверены, что хотите отменить эту заявку?")) {
      return;
    }

    setCancellingId(applicationId);

    try {
      const response = await fetch("/api/applications/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      if (response.ok) {
        // Обновляем список заявок
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: "CANCELLED" as const } : app
          )
        );
        router.refresh();
        // Обновляем статистику на дашборде
        window.dispatchEvent(new Event("stats-update"));
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при отмене заявки");
      }
    } catch (error) {
      console.error("Error cancelling application:", error);
      alert("Произошла ошибка. Попробуйте позже.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <>
      {created === "true" && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 mb-1">
                Заявка успешно подана!
              </h3>
              <p className="text-sm text-green-800">
                Ваша заявка принята в обработку. Мы скоро свяжемся с вами для уточнения деталей.
              </p>
            </div>
          </div>
        </div>
      )}

      {statusChangeNotification?.show && (
        <div
          className={`mb-6 border rounded-lg p-4 ${
            statusChangeNotification.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {statusChangeNotification.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-semibold mb-1 ${
                  statusChangeNotification.type === "success"
                    ? "text-green-900"
                    : "text-blue-900"
                }`}
              >
                {statusChangeNotification.type === "success"
                  ? "Заявка завершена!"
                  : "Статус заявки обновлен"}
              </p>
              <p
                className={`text-sm ${
                  statusChangeNotification.type === "success"
                    ? "text-green-800"
                    : "text-blue-800"
                }`}
              >
                {statusChangeNotification.message}
              </p>
            </div>
            <button
              onClick={() => setStatusChangeNotification(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Закрыть уведомление"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {applications.map((app) => {
          const status = statusConfig[app.status];
          const StatusIcon = status.icon;
          
          // Проверяем, является ли это заявкой на технические условия
          let isTechnicalConditions = false;
          let techData: any = null;
          try {
            if (app.description) {
              const parsed = JSON.parse(app.description);
              if (parsed.type === "technical_conditions") {
                isTechnicalConditions = true;
                techData = parsed;
              }
            }
          } catch (e) {
            // Не JSON, значит обычная заявка
          }

          return (
            <Card key={app.id} className={`${status.bgClassName} border-2`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">
                      {isTechnicalConditions ? "Заявка на технические условия" : app.service.title}
                    </CardTitle>
                    <CardDescription className="mb-2">
                      {isTechnicalConditions ? (
                        <div className="space-y-1">
                          <div>
                            <strong>ФИО:</strong> {techData?.lastName} {techData?.firstName} {techData?.middleName}
                          </div>
                          {techData?.objectAddress && (
                            <div>
                              <strong>Адрес объекта:</strong> {techData.objectAddress}
                            </div>
                          )}
                          {techData?.connectionTypeWater && techData?.connectionTypeSewerage && (
                            <div>
                              <strong>Подключение:</strong> Водоснабжение и водоотведение
                            </div>
                          )}
                          {techData?.connectionTypeWater && !techData?.connectionTypeSewerage && (
                            <div>
                              <strong>Подключение:</strong> Водоснабжение
                            </div>
                          )}
                          {!techData?.connectionTypeWater && techData?.connectionTypeSewerage && (
                            <div>
                              <strong>Подключение:</strong> Водоотведение
                            </div>
                          )}
                        </div>
                      ) : (
                        app.description || "Без описания"
                      )}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Создана: {new Date(app.createdAt instanceof Date ? app.createdAt : new Date(app.createdAt)).toLocaleDateString("ru-RU")}
                      </span>
                      {app.address && <span>Адрес: {app.address}</span>}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${status.className}`}>
                    <StatusIcon className="h-5 w-5" />
                    <span className="font-medium">{status.label}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {isTechnicalConditions && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Генерируем и скачиваем PDF
                          const params = new URLSearchParams();
                          Object.keys(techData).forEach(key => {
                            if (techData[key] !== null && techData[key] !== undefined) {
                              params.append(key, String(techData[key]));
                            }
                          });
                          window.open(`/stat-abonentom/download?${params.toString()}`, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Скачать заявление
                      </Button>
                    )}
                    {app.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleCancel(app.id)}
                        disabled={cancellingId === app.id}
                      >
                        {cancellingId === app.id ? "Отмена..." : "Отменить"}
                      </Button>
                    )}
                  </div>

                  {/* Документы, загруженные администратором */}
                  {app.files && app.files.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Документы от администратора ({app.files.length})
                      </h4>
                      <div className="space-y-2">
                        {app.files.map((file) => (
                          <a
                            key={file.id}
                            href={file.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                          >
                            <FileText className="h-4 w-4" />
                            <span>{file.fileName}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {applications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">У вас нет заявок</p>
            <Button asChild>
              <Link href="/services">Подать заявку</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}

