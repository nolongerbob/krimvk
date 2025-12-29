"use client";

import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

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
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={activeCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        <span>Все категории</span>
        {counts.all > 0 && (
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
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
            className="flex items-center gap-2"
          >
            <span>{label}</span>
            {counts[category] > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {counts[category]}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}





