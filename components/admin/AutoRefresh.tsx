"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AutoRefreshProps {
  interval?: number; // интервал в секундах
}

export function AutoRefresh({ interval = 30 }: AutoRefreshProps) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(true);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(interval);

  useEffect(() => {
    if (!isEnabled) {
      setTimeUntilRefresh(interval);
      return;
    }

    const timer = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          // Используем router.refresh() для обновления серверных компонентов
          router.refresh();
          return interval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, interval, router]);

  const handleManualRefresh = () => {
    router.refresh();
    setTimeUntilRefresh(interval);
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      {isEnabled && (
        <span className="text-xs">
          Обновление через {timeUntilRefresh}с
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleManualRefresh}
        className="h-8"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEnabled(!isEnabled)}
        className="h-8 text-xs"
      >
        {isEnabled ? "Отключить автообновление" : "Включить автообновление"}
      </Button>
    </div>
  );
}

