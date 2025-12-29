"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ApplicationActionsProps {
  applicationId: string;
  currentStatus: string;
}

export function ApplicationActions({ applicationId, currentStatus }: ApplicationActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", applicationId);
      formData.append("status", newStatus);

      const response = await fetch("/api/admin/applications/update", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Обновляем данные страницы
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при обновлении статуса");
      }
    } catch (error) {
      console.error("Error updating application:", error);
      alert("Ошибка при обновлении статуса");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      {currentStatus === "PENDING" && (
        <>
          <Button
            size="sm"
            onClick={() => handleStatusChange("IN_PROGRESS")}
            disabled={isLoading}
          >
            {isLoading ? "Обновление..." : "Взять в работу"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600"
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={isLoading}
          >
            Отклонить
          </Button>
        </>
      )}
      {currentStatus === "IN_PROGRESS" && (
        <Button
          size="sm"
          className="bg-green-600"
          onClick={() => handleStatusChange("COMPLETED")}
          disabled={isLoading}
        >
          {isLoading ? "Обновление..." : "Завершить"}
        </Button>
      )}
    </div>
  );
}

