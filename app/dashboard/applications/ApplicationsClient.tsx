"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Download,
} from "lucide-react";
import Link from "next/link";
import { CompletedApplicationDetails } from "@/components/user/CompletedApplicationDetails";
import { fileHrefForStoredUrl } from "@/lib/file-url";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { cn } from "@/lib/utils";
import { dashboardButtonClass } from "@/components/dashboard/dashboard-styles";

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

const outlineBtnClass = cn(
  dashboardButtonClass,
  "h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
);

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
  service: {
    id?: string;
    title: string;
  } | null;
  description: string | null;
  address: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: Date | string;
  files?: ApplicationFile[];
}

interface ApplicationsClientProps {
  applications: Application[];
}

function parseTechnicalConditions(description: string | null) {
  if (!description) {
    return { isTechnicalConditions: false, techData: null as Record<string, unknown> | null };
  }
  try {
    let jsonPart = description;
    const commentIndex = description.indexOf(
      "\n\nКомментарий при завершении:"
    );
    if (commentIndex !== -1) {
      jsonPart = description.substring(0, commentIndex).trim();
    }
    const parsed = JSON.parse(jsonPart) as { type?: string };
    if (parsed.type === "technical_conditions") {
      return { isTechnicalConditions: true, techData: parsed };
    }
  } catch {
    /* обычная заявка */
  }
  return { isTechnicalConditions: false, techData: null };
}

export function ApplicationsClient({
  applications: initialApplications,
}: ApplicationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState(initialApplications);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusChangeNotification, setStatusChangeNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "info";
  } | null>(null);

  const created = searchParams.get("created");

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  useEffect(() => {
    initialApplications.forEach((newApp) => {
      const oldApp = applications.find((a) => a.id === newApp.id);
      if (oldApp && oldApp.status !== newApp.status) {
        const statusLabels: Record<string, string> = {
          PENDING: "Ожидает обработки",
          IN_PROGRESS: "В работе",
          COMPLETED: "Завершена",
          CANCELLED: "Отменена",
        };
        setStatusChangeNotification({
          show: true,
          message: `Статус заявки «${newApp.service?.title ?? "Заявка"}» изменён на «${statusLabels[newApp.status] || newApp.status}»`,
          type: newApp.status === "COMPLETED" ? "success" : "info",
        });
        setTimeout(() => setStatusChangeNotification(null), 5000);
      }
    });
    setApplications(initialApplications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialApplications]);

  useEffect(() => {
    if (created === "true") {
      router.refresh();
      window.dispatchEvent(new Event("stats-update"));
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
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, status: "CANCELLED" as const }
              : app
          )
        );
        router.refresh();
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
      {created === "true" ? (
        <div className="mb-6 flex items-start gap-3 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Заявка успешно подана
            </p>
            <p className="text-sm text-emerald-800">
              Ваша заявка принята в обработку. Мы скоро свяжемся с вами для
              уточнения деталей.
            </p>
          </div>
        </div>
      ) : null}

      {statusChangeNotification?.show ? (
        <div
          className={cn(
            "mb-6 flex items-start gap-3 rounded-none border px-4 py-3",
            statusChangeNotification.type === "success"
              ? "border-emerald-200 bg-emerald-50"
              : "border-blue-200 bg-blue-50"
          )}
        >
          {statusChangeNotification.type === "success" ? (
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-semibold",
                statusChangeNotification.type === "success"
                  ? "text-emerald-900"
                  : "text-blue-900"
              )}
            >
              {statusChangeNotification.type === "success"
                ? "Заявка завершена"
                : "Статус заявки обновлён"}
            </p>
            <p
              className={cn(
                "text-sm",
                statusChangeNotification.type === "success"
                  ? "text-emerald-800"
                  : "text-blue-800"
              )}
            >
              {statusChangeNotification.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStatusChangeNotification(null)}
            className="shrink-0 text-slate-400 hover:text-slate-600"
            aria-label="Закрыть уведомление"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <ul className="space-y-3">
        {applications.map((app) => {
          const status = statusConfig[app.status];
          const StatusIcon = status.icon;
          const { isTechnicalConditions, techData } = parseTechnicalConditions(
            app.description
          );
          const title = isTechnicalConditions
            ? "Заявка на технические условия"
            : app.service?.title ?? "Заявка";
          const createdLabel = new Date(
            app.createdAt instanceof Date
              ? app.createdAt
              : new Date(app.createdAt)
          ).toLocaleDateString("ru-RU");

          return (
            <li key={app.id}>
              <DashboardCard>
                <DashboardCardBody className="p-0">
                  <div className="border-b border-slate-100 px-4 py-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">
                            {title}
                          </p>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-xs font-medium",
                              status.tagClass
                            )}
                          >
                            <StatusIcon className="h-3.5 w-3.5" strokeWidth={2} />
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Создана: {createdLabel}
                          {app.address ? ` · ${app.address}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 px-4 py-3.5">
                    {isTechnicalConditions && techData ? (
                      <div className="space-y-1 text-sm text-slate-600">
                        <p>
                          <span className="text-slate-500">ФИО:</span>{" "}
                          <span className="font-medium text-slate-900">
                            {String(techData.lastName ?? "")}{" "}
                            {String(techData.firstName ?? "")}{" "}
                            {String(techData.middleName ?? "")}
                          </span>
                        </p>
                        {techData.objectAddress ? (
                          <p>
                            <span className="text-slate-500">Адрес объекта:</span>{" "}
                            <span className="text-slate-900">
                              {String(techData.objectAddress)}
                            </span>
                          </p>
                        ) : null}
                        {techData.connectionTypeWater ||
                        techData.connectionTypeSewerage ? (
                          <p>
                            <span className="text-slate-500">Подключение:</span>{" "}
                            <span className="text-slate-900">
                              {techData.connectionTypeWater &&
                              techData.connectionTypeSewerage
                                ? "Водоснабжение и водоотведение"
                                : techData.connectionTypeWater
                                  ? "Водоснабжение"
                                  : "Водоотведение"}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    ) : app.description ? (
                      <p className="text-sm leading-relaxed text-slate-600 line-clamp-4">
                        {app.description}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">Без описания</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {isTechnicalConditions && techData ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={outlineBtnClass}
                          onClick={() => {
                            const params = new URLSearchParams();
                            Object.keys(techData).forEach((key) => {
                              const val = techData[key];
                              if (val !== null && val !== undefined) {
                                params.append(key, String(val));
                              }
                            });
                            window.open(
                              `/stat-abonentom/download?${params.toString()}`,
                              "_blank"
                            );
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Скачать заявление
                        </Button>
                      ) : null}
                      {app.status === "COMPLETED" ? (
                        <CompletedApplicationDetails
                          application={app}
                          isTechnicalConditions={isTechnicalConditions}
                          triggerClassName={outlineBtnClass}
                        />
                      ) : null}
                      {app.status === "PENDING" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            outlineBtnClass,
                            "border-red-200 text-red-600 hover:bg-red-50"
                          )}
                          onClick={() => handleCancel(app.id)}
                          disabled={cancellingId === app.id}
                        >
                          {cancellingId === app.id ? "Отмена…" : "Отменить"}
                        </Button>
                      ) : null}
                    </div>

                    {app.files && app.files.length > 0 ? (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <FileText className="h-4 w-4" strokeWidth={1.75} />
                          Документы от администратора ({app.files.length})
                        </p>
                        <ul className="space-y-1.5">
                          {app.files.map((file) => (
                            <li key={file.id}>
                              <a
                                href={fileHrefForStoredUrl(file.filePath)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                              >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span>{file.fileName}</span>
                                <span className="text-xs font-normal text-slate-500">
                                  ({(file.fileSize / 1024).toFixed(1)} KB)
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </DashboardCardBody>
              </DashboardCard>
            </li>
          );
        })}
      </ul>

      {applications.length === 0 ? (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <FileText
              className="mx-auto mb-4 h-10 w-10 text-slate-400"
              strokeWidth={1.75}
            />
            <p className="mb-1 text-sm text-slate-600">У вас нет заявок</p>
            <p className="mb-4 text-xs text-slate-500">
              Подайте заявку на услугу через каталог
            </p>
            <Button
              asChild
              className={cn(
                dashboardButtonClass,
                "rounded-none bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <Link href="/services">Подать заявку</Link>
            </Button>
          </DashboardCardBody>
        </DashboardCard>
      ) : null}
    </>
  );
}
