"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface AdminNotificationsBadgeProps {
  type: "applications" | "questions";
}

export function AdminNotificationsBadge({ type }: AdminNotificationsBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/admin/notifications");
        if (response.ok) {
          const data = await response.json();
          if (type === "applications") {
            setCount(data.newApplications);
          } else {
            setCount(data.newQuestions);
          }
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
  }, [type]);

  if (count === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="ml-2 h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}





