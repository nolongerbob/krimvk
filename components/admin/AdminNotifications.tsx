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
        const response = await fetch("/api/admin/notifications");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    // Загружаем сразу
    fetchNotifications();

    // Обновляем каждые 10 секунд
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
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
