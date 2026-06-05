"use client";

import { Button } from "@/components/ui/button";
import { List } from "lucide-react";
import { adminOutlineBtnClass, adminPrimaryBtnClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

interface ServiceCategoryFiltersProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  counts: { [key: string]: number };
}

const categoryLabels: { [key: string]: string } = {
  подключение: "Подключение",
  ремонт: "Ремонт",
  установка: "Установка",
  консультация: "Консультация",
  документы: "Документы",
  анализ: "Анализ",
};

export function ServiceCategoryFilters({
  categories,
  activeCategory,
  onCategoryChange,
  counts,
}: ServiceCategoryFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Button
        variant={activeCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className={cn(
          "flex items-center gap-2",
          activeCategory === null ? adminPrimaryBtnClass : adminOutlineBtnClass
        )}
      >
        <List className="h-4 w-4" />
        <span>Все категории</span>
        {counts.all > 0 && (
          <span
            className={cn(
              "px-1.5 py-0.5 text-xs",
              activeCategory === null ? "bg-white/20" : "bg-slate-100 text-slate-600"
            )}
          >
            {counts.all}
          </span>
        )}
      </Button>
      {categories.map((category) => {
        const label = categoryLabels[category] || category;
        const isActive = activeCategory === category;
        return (
          <Button
            key={category}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category)}
            className={cn(
              "flex items-center gap-2",
              isActive ? adminPrimaryBtnClass : adminOutlineBtnClass
            )}
          >
            <span>{label}</span>
            {counts[category] > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-xs",
                  isActive ? "bg-white/20" : "bg-slate-100 text-slate-600"
                )}
              >
                {counts[category]}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
