"use client";

import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, CheckCircle, XCircle, List } from "lucide-react";

type FilterStatus = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface ApplicationFiltersProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  counts: {
    all: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

export function ApplicationFilters({
  activeFilter,
  onFilterChange,
  counts,
}: ApplicationFiltersProps) {
  const filters = [
    { value: "ALL" as FilterStatus, label: "Все", icon: List, count: counts.all },
    { value: "PENDING" as FilterStatus, label: "Ожидают", icon: Clock, count: counts.pending },
    { value: "IN_PROGRESS" as FilterStatus, label: "В работе", icon: AlertCircle, count: counts.inProgress },
    { value: "COMPLETED" as FilterStatus, label: "Завершенные", icon: CheckCircle, count: counts.completed },
    { value: "CANCELLED" as FilterStatus, label: "Отмененные", icon: XCircle, count: counts.cancelled },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.value;
        return (
          <Button
            key={filter.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span>{filter.label}</span>
            {filter.count > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {filter.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}





