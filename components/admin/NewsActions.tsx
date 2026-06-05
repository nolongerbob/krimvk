"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { adminOutlineBtnClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

interface NewsActionsProps {
  newsId: string;
  published: boolean;
}

export function NewsActions({ newsId, published }: NewsActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", newsId);
      formData.append("published", published ? "false" : "true");

      const response = await fetch("/api/admin/news/toggle", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при обновлении статуса");
      }
    } catch (error) {
      console.error("Error toggling news:", error);
      alert("Ошибка при обновлении статуса");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить эту новость?")) {
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", newsId);

      const response = await fetch("/api/admin/news/delete", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Ошибка при удалении новости");
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Ошибка при удалении новости");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={adminOutlineBtnClass}
      >
        {isLoading ? "Обновление..." : published ? "Снять с публикации" : "Опубликовать"}
      </Button>
      <Button asChild variant="outline" size="sm" className={adminOutlineBtnClass}>
        <Link href={`/admin/news/${newsId}/edit`}>Редактировать</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn(adminOutlineBtnClass, "text-red-600 hover:text-red-700")}
        onClick={handleDelete}
        disabled={isLoading}
      >
        {isLoading ? "Удаление..." : "Удалить"}
      </Button>
    </div>
  );
}
