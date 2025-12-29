"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddressInput } from "@/components/AddressInput";

export default function ApplyServicePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [service, setService] = useState<{ id: string; title: string; description: string; price?: string } | null>(null);
  const [formData, setFormData] = useState({
    address: "",
    phone: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingService, setLoadingService] = useState(true);
  const [existingApplication, setExistingApplication] = useState<{
    id: string;
    status: string;
    createdAt: string;
    serviceTitle: string;
  } | null>(null);

  // Загружаем данные услуги и проверяем активные заявки
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setService(data.service);
        } else {
          setError("Услуга не найдена");
        }
      } catch (err) {
        setError("Ошибка при загрузке услуги");
      } finally {
        setLoadingService(false);
      }
    };

    const checkExistingApplication = async () => {
      if (session?.user?.id && params.id) {
        try {
          const response = await fetch(`/api/applications/check?serviceId=${params.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.existingApplication) {
              setExistingApplication(data.existingApplication);
            }
          }
        } catch (err) {
          // Игнорируем ошибки проверки
        }
      }
    };

    if (params.id) {
      fetchService();
      checkExistingApplication();
    }
  }, [params.id, session?.user?.id]);

  // Загружаем телефон пользователя из профиля
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id && status === "authenticated") {
        try {
          const response = await fetch(`/api/user/profile`);
          if (response.ok) {
            const data = await response.json();
            if (data.user?.phone) {
              setFormData(prev => {
                // Заполняем только если поле пустое
                if (!prev.phone) {
                  return { ...prev, phone: data.user.phone };
                }
                return prev;
              });
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    };

    fetchUserData();
  }, [session?.user?.id, status]);

  // Редирект если не авторизован
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/services/${params.id}/apply`);
    }
  }, [status, router, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/applications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: params.id,
          address: formData.address,
          phone: formData.phone,
          description: formData.description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Показываем уведомление и переходим на страницу заявок
        router.push("/dashboard/applications?created=true");
      } else {
        // Если есть информация о существующей заявке, показываем её
        if (data.existingApplication) {
          setExistingApplication(data.existingApplication);
        }
        setError(data.error || "Ошибка при создании заявки");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("Произошла ошибка. Попробуйте позже.");
      setSubmitting(false);
    }
  };

  if (status === "loading" || loadingService) {
    return (
      <div className="container py-12 px-4 max-w-2xl">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-12 px-4 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">{error || "Услуга не найдена"}</p>
            <Button asChild className="mt-4">
              <Link href="/services">Вернуться к услугам</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 px-4 max-w-2xl">
      <Button
        variant="ghost"
        asChild
        className="mb-6"
      >
        <Link href="/services">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к услугам
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Подача заявки</CardTitle>
          <CardDescription>{service.title}</CardDescription>
        </CardHeader>
        <CardContent>
          {existingApplication && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    У вас уже есть активная заявка
                  </h3>
                  <p className="text-sm text-blue-800 mb-2">
                    На услугу "{existingApplication.serviceTitle}" уже подана заявка{" "}
                    {new Date(existingApplication.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    . Мы скоро ответим на вашу заявку!
                  </p>
                  <p className="text-xs text-blue-700 mb-3">
                    Статус:{" "}
                    {existingApplication.status === "PENDING"
                      ? "Ожидает обработки"
                      : existingApplication.status === "IN_PROGRESS"
                      ? "В работе"
                      : existingApplication.status}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <Link href="/dashboard/applications">Посмотреть мои заявки</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            {existingApplication && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Вы не можете подать вторую заявку на эту услугу, пока не завершена текущая.
                </p>
              </div>
            )}
            <div>
              <label htmlFor="address" className="text-sm font-medium mb-2 block">
                Адрес объекта
              </label>
              <AddressInput
                id="address"
                value={formData.address}
                onChange={(address) => setFormData({ ...formData, address })}
                placeholder="Начните вводить адрес (например: г. Симферополь, ул. Ленина)"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-medium mb-2 block">
                Контактный телефон
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+7 (999) 123-45-67"
              />
              {formData.phone && (
                <p className="text-xs text-gray-500 mt-1">
                  Телефон загружен из вашего профиля. Вы можете изменить его.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-medium mb-2 block">
                Дополнительная информация
              </label>
              <textarea
                id="description"
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Опишите детали заявки..."
              />
            </div>
            {service.price && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Стоимость услуги:</strong> {service.price}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Точная стоимость будет рассчитана после осмотра объекта нашим специалистом.
                </p>
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting || !!existingApplication}
              className="w-full"
              size="lg"
            >
              {submitting ? "Отправка..." : existingApplication ? "Заявка уже подана" : "Подать заявку"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


