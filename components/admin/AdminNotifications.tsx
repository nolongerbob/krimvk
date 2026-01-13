"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface Notifications {
  newApplications: number;
  newQuestions: number;
  inProgressQuestions: number;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notifications>({
    newApplications: 0,
    newQuestions: 0,
    inProgressQuestions: 0,
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Таймаут 2 секунды
        
        const response = await fetch("/api/admin/notifications", {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error: any) {
        // Игнорируем ошибки, чтобы не ломать страницу
        if (error.name !== 'AbortError') {
          // Тихо игнорируем
        }
      }
    };

    // Загружаем с задержкой, чтобы не блокировать рендеринг
    const timeout = setTimeout(fetchNotifications, 1000);

    // Обновляем каждые 30 секунд (реже)
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const totalNotifications = notifications.newApplications + notifications.newQuestions;

  if (totalNotifications === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="ml-2 h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
    >
      {totalNotifications > 99 ? "99+" : totalNotifications}
    </Badge>
  );
}
